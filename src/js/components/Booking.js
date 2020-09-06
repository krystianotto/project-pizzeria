import {templates, select, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking{

  constructor(element){
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectTable();
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.RepeatParam,
        endDateParam,
      ]
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponses){
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([bookings, eventsCurrent, eventsRepeat]){
        thisBooking.parseData(bookings,eventsCurrent,eventsRepeat);
      });

  }

  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;

    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date]  == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);


    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5)
    {
      if(typeof thisBooking.booked[date][hourBlock]  == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }

  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)){
        table.classList.add(classNames.booking.tableBooked);
      }else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

    thisBooking.SliderColour();
  }

  SliderColour() {
    const thisBooking = this;
    const rangeSlider = document.querySelector('.rangeSlider');
    let percentage = 0;
    const colorGrad = [];
    for (let i = 12; i < 24; i += 0.5) {
      percentage += 100 / 24;
      if ((typeof thisBooking.booked[thisBooking.datePicker.value][i] == 'undefined') || thisBooking.booked[thisBooking.datePicker.value][i].length == 1) {
        let color = `green ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      } else if (thisBooking.booked[thisBooking.datePicker.value][i].length == 2) {
        let color = `orange ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      } else {
        let color = `red ${percentage}%`;
        colorGrad.push(color);
        console.log('thisBooking.booked[thisBooking.datePicker.value][i]', thisBooking.booked[thisBooking.datePicker.value][i]);
      }
    }
    const linearGrad = colorGrad.join();
    const gradient = `linear-gradient(to right, ${linearGrad})`;
    rangeSlider.style.backgroundImage = gradient;
  }

  render(element) {
    const thisBooking = this;

    const generatedHtml = templates.bookingWidget();

    thisBooking.dom = {};

    thisBooking.dom.wrapper = element;

    this.dom.wrapper.innerHTML = generatedHtml;

    thisBooking.dom.peopleAmount =  thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.adress = thisBooking.dom.wrapper.querySelector(select.booking.adress);
    thisBooking.dom.submit = thisBooking.dom.wrapper.querySelector(select.booking.submit);
    thisBooking.dom.startes = thisBooking.dom.wrapper.querySelectorAll(select.booking.startes);
  }

  selectTable(){
    const thisBooking = this;

    for(let table of thisBooking.dom.tables){
      table.addEventListener('click', function(){
        if(table.classList.contains(classNames.booking.tableBooked)){
          return false;
        }else{
          for(let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tablePicked);
          }
          table.classList.add(classNames.booking.tablePicked);
        }
      });
    }
  }

  sendBook(){
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.booking;
    let pickedTable = false;
    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }
      if (table.classList.contains(classNames.booking.tablePicked)){
        pickedTable = tableId;
      }
    }

    const payload = {
      date: thisBooking.datePicker.correctValue,
      hour: thisBooking.hourPicker.correctValue,
      table: pickedTable,
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      phone: thisBooking.dom.phone.value,
      email: thisBooking.dom.adress.value,
    };

    for(let starter of thisBooking.dom.startes){
      if(starter.checked == true) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(rawResponse => rawResponse.json())
      .then(parsedResponse => {
        console.log(parsedResponse);
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
      });
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });

    thisBooking.dom.hourPicker.addEventListener('updated', function(){
      for(let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.tablePicked);
      }
    });

    thisBooking.dom.datePicker.addEventListener('updated', function(){
      for(let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.tablePicked);
      }
    });

    thisBooking.dom.submit.addEventListener('click', function(){
      event.preventDefault();
      thisBooking.sendBook();
      console.log('booking');
    });

  }

}

export default Booking;
