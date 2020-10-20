import React, {Component} from 'react';
import {FlatList, ActivityIndicator, View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Image} from 'react-native';
import Reservation from './reservation';
import PropTypes from 'prop-types';
import XDate from 'xdate';
import _isEmpty from 'lodash/isEmpty'

import dateutils from '../../dateutils';
import styleConstructor from './style';

const { width } = Dimensions.get('window')


class ReservationList extends Component {
  static displayName = 'IGNORE';

  static propTypes = {
    // specify your item comparison function for increased performance
    rowHasChanged: PropTypes.func,
    // specify how each item should be rendered in agenda
    renderItem: PropTypes.func,
    // specify how each date should be rendered. day can be undefined if the item is not first in that day.
    renderDay: PropTypes.func,
    // specify how empty date content with no items should be rendered
    renderEmptyDate: PropTypes.func,
    // callback that gets called when day changes while scrolling agenda list
    onDayChange: PropTypes.func,
    // onScroll ListView event
    onScroll: PropTypes.func,
    // the list of items that have to be displayed in agenda. If you want to render item as empty date
    // the value of date key kas to be an empty array []. If there exists no value for date key it is
    // considered that the date in question is not yet loaded
    reservations: PropTypes.object,
    selectedDay: PropTypes.instanceOf(XDate),
    topDay: PropTypes.instanceOf(XDate),
    refreshControl: PropTypes.element,
    refreshing: PropTypes.bool,
    onRefresh: PropTypes.func,
    onScrollBeginDrag: PropTypes.func,
    onScrollEndDrag: PropTypes.func,
    onMomentumScrollBegin: PropTypes.func,
    onMomentumScrollEnd: PropTypes.func,
    onPressItem: PropTypes.func,
    onPressDeleteItem: PropTypes.func,
    deleteImage: PropTypes.string
  };

  constructor(props) {
    super(props);

    this.styles = styleConstructor(props.theme);

    this.state = {
      reservations: []
    };

    this.heights=[];
    this.selectedDay = '';
    this.scrollOver = true;
  }

  UNSAFE_componentWillMount() {
    // this.updateReservations(this.props);
    // this.updateDataSource(this.getReservations(this.props).reservations);
  }

  updateDataSource(reservations) {
    const updateArr = []
    reservations.map((itemI, indexI) => {
      reservations.map((itemY, indexY) => {
        if (itemI.id === itemY.id || indexY > indexI) return
        const itemStart = itemI.startFrom
        const itemEnd = itemI.startFrom + itemI?.height
        const iStart = itemY.startFrom
        const iEnd = itemY.startFrom + itemY.height
        if ((itemStart >= iStart && itemStart <= iEnd) || (itemEnd >= iStart && itemEnd <= iEnd)) {
          let needNew = true
          updateArr.map((item, index) => 
              item.map(i => {
                if(i === itemY.id || i === itemI.id) {
                  needNew = false
                  const indexOf = updateArr[index].indexOf(itemI.id)
                  if (indexOf === -1) updateArr[index].push(itemI.id)
                } else {
                  
                }
              })
            )
          if(needNew) {
            updateArr.push([itemI.id, itemY.id])
          } 
          
        }
      })
    })

    reservations.map((itemI, indexI) => {
      updateArr.map((item, index) => 
        item.map((i, iter) => {
          if(i === itemI.id) {
            itemI.row = updateArr[index].length
            itemI.position = iter
          }
        })
      )
      return itemI
    })

    this.setState({
      reservations
    });
  }

  updateReservations(props) {
    const reservations = this.getReservations(props);
    if (this.list && !dateutils.sameDate(props.selectedDay, this.selectedDay)) {
      let scrollPosition = 0;
      for (let i = 0; i < reservations.scrollPosition; i++) {
        scrollPosition += this.heights[i] || 0;
      }
      this.scrollOver = false;
      // this.list.scrollToOffset({offset: scrollPosition, animated: true});
    }
    this.selectedDay = !_isEmpty(props?.reservations) && props.selectedDay;
    this.updateDataSource(reservations.reservations);
  }

  UNSAFE_componentWillReceiveProps(props) {
    if (props.selectedDay.toString('yyyy-MM-dd') == props.topDay.toString('yyyy-MM-dd')) {
      const offset = this.currentTime()
      this?.list?.scrollToOffset({offset: 800, animated: true});
    }
    
    if (this.selectedDay.toString('yyyy-MM-dd') !== props.selectedDay.toString('yyyy-MM-dd')
        || (_isEmpty(this.state.reservations) && !_isEmpty(props?.reservations))) {
      this.updateReservations(props);
    }
  }

  onScroll(event) {
    const yOffset = event.nativeEvent.contentOffset.y;
    this.props.onScroll(yOffset);
    let topRowOffset = 0;
    let topRow;
    for (topRow = 0; topRow < this.heights.length; topRow++) {
      if (topRowOffset + this.heights[topRow] / 2 >= yOffset) {
        break;
      }
      topRowOffset += this.heights[topRow];
    }
    const row = this.state.reservations[topRow];
    if (!row) return;
  }

  onRowLayoutChange(ind, event) {
    this.heights[ind] = event.nativeEvent.layout.height;
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  currentTime() {
    const d = new Date(Date.now())
    const currentTime = String(d.getHours()) + String(d.getMinutes() > 10 ? d.getMinutes() : '0' + d.getMinutes())
    return Number(currentTime)
  }

  renderRow({item, index}) {
    const items = []

    const offset = this.currentTime()

    const event = (item, index) => {
      const taskColor = this.hexToRgb(item?.color)

      const newWidth = (width - 100) / item?.row
    
      const extraStyles = item?.height === 25 && { bottom: 2, height: 20, width: 20 }
      return (
        <View key={index} style={{ position: 'absolute', width: newWidth || width - 100, top: item?.startFrom, left: item?.position ? 100 + item?.position * newWidth : 100, height: item?.height, backgroundColor: `rgba(${taskColor.r},${taskColor.g},${taskColor.b},0.3)`, borderLeftWidth: 2, borderLeftColor: `rgba(${taskColor.r},${taskColor.g},${taskColor.b},1)`, borderRadius: 2, overflow: 'hidden' }}>
          <TouchableOpacity style={{ flex: 1, height: item?.height}} onPress={() => this.props.onPressItem(item, this.selectedDay.toString('yyyy-MM-dd'))}>
            <ScrollView>
            <View style={{ flexDirection: 'row', marginLeft: 15, marginTop: 10 }}>
              {item?.name.length > 0 && <Text style={{ fontSize: 15, color: `rgba(${taskColor.r},${taskColor.g},${taskColor.b},1)`, marginRight: 5}}>•</Text>}
              <Text style={{ fontSize: 15, color: 'black'}}>{item?.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginLeft: 27, marginTop: 10 }}>
              <Text style={{ fontSize: 15, color: '#fff'}}>{item?.desc}</Text>
            </View>
            </ScrollView>
            <TouchableOpacity onPress={() => this.props.onPressDeleteItem(item)} style={[{ position: 'absolute', right: 5, bottom: 15, flex: 1, maxHeight: 25, width: 30, justifyContent: 'center', alignContent: 'center' }, extraStyles]}>
              <Image style={[{ height: 30, width: 30 }, extraStyles]} resizeMode={'contain'} source={this.props.deleteImage}/>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>)
        }

    for (let i = 0; i <= 24; i++ ) {
      items.push(
        <View key={i}>
          <View style={{ alignItems: 'flex-start', justifyContent: 'flex-start', marginLeft: 30, width: 100, height: 25  }}>
            <Text style={{ textAlign: 'left', position: 'absolute', top: -7, fontSize: 12 }} >{i > 9 ? i : '0' + i}.00</Text>
          </View>
          <View style={{ marginLeft: 30, width: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'black'}}/>
          <View style={{ marginLeft: 30, width: 15, height: 25 , borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'black'}}/>
          <View style={{ marginLeft: 30, width: 10, height: 25 , marginBottom: 25 - StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'black'}}/>
        </View>)
    }

    return (
      <View key={index} onLayout={this.onRowLayoutChange.bind(this, index)}>
        {items}
        {this.props.selectedDay.toString('yyyy-MM-dd') == this.props.topDay.toString('yyyy-MM-dd') && <View style={{ position: 'absolute', width: '100%', top: offset, borderBottomWidth: 1, borderBottomColor: '#B6C3F7' }}>
          <View style={{ height: 7, width: 7, top: 4, left: 10, borderRadius: 50, backgroundColor: '#5982F1'}}/>
        </View>}
        {item.map((i, index) => event(i, index))}
      </View>
    );
  }

  getReservationsForDay(iterator, props) {
    const day = iterator.clone();
    const res = props.reservations[day.toString('yyyy-MM-dd')];
    if (res && res.length) {
      return res.map((reservation, i) => {
        return {
          reservation,
          date: i ? false : day,
          day
        };
      });
    } else if (res) {
      return [{
        date: iterator.clone(),
        day
      }];
    } else {
      return false;
    }
  }

  onListTouch() {
    this.scrollOver = true;
  }

  getReservations(props) {
    if (!props.reservations || !props.selectedDay) {
      return {reservations: [], scrollPosition: 0};
    }
    let reservations = [];
    if (this.selectedDay.toString('yyyy-MM-dd') !== props.selectedDay.clone().toString('yyyy-MM-dd')) {
      const iterator = props.selectedDay.clone().toString('yyyy-MM-dd');
      if(iterator in props.reservations) {
        reservations = props.reservations[iterator]
      }
    }
    const scrollPosition = reservations.length;

    return {reservations, scrollPosition};
  }

  render() {
    const {reservations} = this.props;
    if (!reservations || !reservations[this.props.selectedDay.toString('yyyy-MM-dd')]) {
      if (this.props.renderEmptyData) {
        return this.props.renderEmptyData();
      }
      return (
        <ActivityIndicator style={{marginTop: 80}} color={this.props.theme && this.props.theme.indicatorColor}/>
      );
    }
    return (
      <FlatList
        ref={(c) => this.list = c}
        style={this.props.style}
        contentContainerStyle={this.styles.content}
        renderItem={this.renderRow.bind(this)}
        data={[this.state.reservations]}
        onScroll={this.onScroll.bind(this)}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onMoveShouldSetResponderCapture={() => {this.onListTouch(); return false;}}
        keyExtractor={(item, index) => String(index)}
        refreshControl={this.props.refreshControl}
        refreshing={this.props.refreshing || false}
        onRefresh={this.props.onRefresh}
        onScrollBeginDrag={this.props.onScrollBeginDrag}
        onScrollEndDrag={this.props.onScrollEndDrag}
        onMomentumScrollBegin={this.props.onMomentumScrollBegin}
        onMomentumScrollEnd={this.props.onMomentumScrollEnd}
        contentContainerStyle={{ paddingTop: 10 }}
      />
    );
  }
}

export default ReservationList;
