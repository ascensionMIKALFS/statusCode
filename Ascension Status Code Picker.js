// ==UserScript==
// @name         Ascension Status Code Picker 3.5
// @namespace    Ascension
// @version      3.5
// @description  Inputs status codes on Ascension service now
// @author       Pamela OConnor
// @match        https://ascensionprod.service-now.com/*
// @grant        Ascension
// @downloadURL  https://raw.githubusercontent.com/ascensionMIKALFS/statusCode/master/Ascension%20Status%20Code%20Picker.js
// @require https://code.jquery.com/jquery-3.1.1.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.17.1/moment.js
// ==/UserScript==


(function () {
    /**
     *  Zebra_DatePicker
     *
     *  Zebra_DatePicker is a small, compact and highly configurable date picker / time picker jQuery plugin
     *
     *  Read more {@link https://github.com/stefangabos/Zebra_Datepicker/ here}
     *
     *  @author     Stefan Gabos <contact@stefangabos.ro>
     *  @version    1.9.12 (last revision: November 24, 2018)
     *  @copyright  (c) 2011 - 2018 Stefan Gabos
     *  @license    http://www.gnu.org/licenses/lgpl-3.0.txt GNU LESSER GENERAL PUBLIC LICENSE
     *  @package    Zebra_DatePicker
     */
    (function (factory) {

        'use strict';

        // AMD
        if (typeof define === 'function' && define.amd) define(['jquery'], factory); // jshint ignore:line

        // CommonJS
        else if (typeof exports === 'object') factory(require('jquery')); // jshint ignore:line

        // browser globals
        else factory(jQuery);


        });
        var Combodate = function (element, options) {
        this.$element = $(element);
        if (!this.$element.is('input')) {
            $.error('Combodate should be applied to INPUT element');
            return;
        }
        this.options = $.extend({}, $.fn.combodate.defaults, options, this.$element.data());
        this.init();
    };
        Combodate.prototype = {
        constructor: Combodate,
        init: function () {
            this.map = {
                //key   regexp    moment.method
                day: ['D', 'date'],
                month: ['M', 'month'],
                year: ['Y', 'year'],
                hour: ['[Hh]', 'hours'],
                minute: ['m', 'minutes'],
                second: ['s', 'seconds'],
                ampm: ['[Aa]', '']
            };

            this.$widget = $('<span class="combodate"></span>').html(this.getTemplate());

            this.initCombos();

            // internal momentjs instance
            this.datetime = null;

            //update original input on change
            this.$widget.on('change', 'select', $.proxy(function (e) {
                this.$element.val(this.getValue()).change();
                // update days count if month or year changes
                if (this.options.smartDays) {
                    if ($(e.target).is('.month') || $(e.target).is('.year')) {
                        this.fillCombo('day');
                    }
                }
            }, this));

            this.$widget.find('select').css('width', 'auto');

            // hide original input and insert widget
            this.$element.hide().after(this.$widget);

            // set initial value
            this.setValue(this.$element.val() || this.options.value);
        },

        /*
         Replace tokens in template with <select> elements
        */
        getTemplate: function () {
            var tpl = this.options.template;
            var inputDisabled = this.$element.prop('disabled');
            var customClass = this.options.customClass;

            //first pass
            $.each(this.map, function (k, v) {
                v = v[0];
                var r = new RegExp(v + '+'),
                    token = v.length > 1 ? v.substring(1, 2) : v;

                tpl = tpl.replace(r, '{' + token + '}');
            });

            //replace spaces with &nbsp;
            tpl = tpl.replace(/ /g, '&nbsp;');

            //second pass
            $.each(this.map, function (k, v) {
                v = v[0];
                var token = v.length > 1 ? v.substring(1, 2) : v;

                tpl = tpl.replace('{' + token + '}', '<select class="' + k + ' ' + customClass + '"' +
                    (inputDisabled ? ' disabled="disabled"' : '') + '></select>');
            });

            return tpl;
        },

        /*
         Initialize combos that presents in template
        */
        initCombos: function () {
            for (var k in this.map) {
                var $c = this.$widget.find('.' + k);
                // set properties like this.$day, this.$month etc.
                this['$' + k] = $c.length ? $c : null;
                // fill with items
                this.fillCombo(k);
            }
        },

        /*
         Fill combo with items
        */
        fillCombo: function (k) {
            var $combo = this['$' + k];
            if (!$combo) {
                return;
            }

            // define method name to fill items, e.g `fillDays`
            var f = 'fill' + k.charAt(0).toUpperCase() + k.slice(1);
            var items = this[f]();
            var value = $combo.val();

            $combo.empty();
            for (var i = 0; i < items.length; i++) {
                $combo.append('<option value="' + items[i][0] + '">' + items[i][1] + '</option>');
            }

            $combo.val(value);
        },

        /*
         Initialize items of combos. Handles `firstItem` option
        */
        fillCommon: function (key) {
            var values = [],
                relTime;

            if (this.options.firstItem === 'name') {
                //need both to support moment ver < 2 and  >= 2
                if (moment.localeData) {
                    relTime = moment.localeData()._relativeTime;
                } else {
                    relTime = moment.relativeTime || moment.langData()._relativeTime;
                }
                var header = typeof relTime[key] === 'function' ? relTime[key](1, true, key, false) : relTime[key];
                //take last entry (see momentjs lang files structure)
                header = header.split(' ').reverse()[0];
                values.push(['', header]);
            } else if (this.options.firstItem === 'empty') {
                values.push(['', '']);
            }
            return values;
        },


        /*
        fill day
        */
        fillDay: function () {
            var items = this.fillCommon('d'),
                name, i,
                twoDigit = this.options.template.indexOf('DD') !== -1,
                daysCount = 31;

            // detect days count (depends on month and year)
            // originally https://github.com/vitalets/combodate/pull/7
            if (this.options.smartDays && this.$month && this.$year) {
                var month = parseInt(this.$month.val(), 10);
                var year = parseInt(this.$year.val(), 10);

                if (!isNaN(month) && !isNaN(year)) {
                    daysCount = moment([year, month]).daysInMonth();
                }
            }

            for (i = 1; i <= daysCount; i++) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }
            return items;
        },

        /*
        fill month
        */
        fillMonth: function () {
            var items = this.fillCommon('M'),
                name, i,
                longNamesNum = this.options.template.indexOf('MMMMMM') !== -1,
                shortNamesNum = this.options.template.indexOf('MMMMM') !== -1,
                longNames = this.options.template.indexOf('MMMM') !== -1,
                shortNames = this.options.template.indexOf('MMM') !== -1,
                twoDigit = this.options.template.indexOf('MM') !== -1;

            for (i = 0; i <= 11; i++) {
                if (longNamesNum) {
                    name = moment().date(1).month(i).format('MM - MMMM');
                } else if (shortNamesNum) {
                    name = moment().date(1).month(i).format('MM - MMM');
                } else if (longNames) {
                    //see https://github.com/timrwood/momentjs.com/pull/36
                    name = moment().date(1).month(i).format('MMMM');
                } else if (shortNames) {
                    name = moment().date(1).month(i).format('MMM');
                } else if (twoDigit) {
                    name = this.leadZero(i + 1);
                } else {
                    name = i + 1;
                }
                items.push([i, name]);
            }
            return items;
        },

        /*
        fill year
        */
        fillYear: function () {
            var items = [],
                name, i,
                longNames = this.options.template.indexOf('YYYY') !== -1;

            for (i = this.options.maxYear; i >= this.options.minYear; i--) {
                name = longNames ? i : (i + '').substring(2);
                items[this.options.yearDescending ? 'push' : 'unshift']([i, name]);
            }

            items = this.fillCommon('y').concat(items);

            return items;
        },

        /*
        fill hour
        */
        fillHour: function () {
            var items = this.fillCommon('h'),
                name, i,
                h12 = this.options.template.indexOf('h') !== -1,
                h24 = this.options.template.indexOf('H') !== -1,
                twoDigit = this.options.template.toLowerCase().indexOf('hh') !== -1,
                min = h12 ? 1 : 0,
                max = h12 ? 12 : 23;

            for (i = min; i <= max; i++) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }
            return items;
        },

        /*
        fill minute
        */
        fillMinute: function () {
            var items = this.fillCommon('m'),
                name, i,
                twoDigit = this.options.template.indexOf('mm') !== -1;

            for (i = 0; i <= 59; i += this.options.minuteStep) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }
            return items;
        },

        /*
        fill second
        */
        fillSecond: function () {
            var items = this.fillCommon('s'),
                name, i,
                twoDigit = this.options.template.indexOf('ss') !== -1;

            for (i = 0; i <= 59; i += this.options.secondStep) {
                name = twoDigit ? this.leadZero(i) : i;
                items.push([i, name]);
            }
            return items;
        },

        /*
        fill ampm
        */
        fillAmpm: function () {
            var ampmL = this.options.template.indexOf('a') !== -1,
                ampmU = this.options.template.indexOf('A') !== -1,
                items = [
                    ['am', ampmL ? 'am' : 'AM'],
                    ['pm', ampmL ? 'pm' : 'PM']
                ];
            return items;
        },

        /*
         Returns current date value from combos.
         If format not specified - `options.format` used.
         If format = `null` - Moment object returned.
        */
        getValue: function (format) {
            var dt, values = {},
                that = this,
                notSelected = false;

            //getting selected values
            $.each(this.map, function (k, v) {
                if (k === 'ampm') {
                    return;
                }

                // if combo exists, use it's value, otherwise use default
                if (that['$' + k]) {
                    values[k] = parseInt(that['$' + k].val(), 10);
                } else {
                    var defaultValue;
                    if (that.datetime) {
                        defaultValue = that.datetime[v[1]]();
                    } else {
                        defaultValue = k === 'day' ? 1 : 0;
                    }
                    values[k] = defaultValue;
                }

                if (isNaN(values[k])) {
                    notSelected = true;
                    return false;
                }
            });

            //if at least one visible combo not selected - return empty string
            if (notSelected) {
                return '';
            }

            //convert hours 12h --> 24h
            if (this.$ampm) {
                //12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
                if (values.hour === 12) {
                    values.hour = this.$ampm.val() === 'am' ? 0 : 12;
                } else {
                    values.hour = this.$ampm.val() === 'am' ? values.hour : values.hour + 12;
                }
            }

            dt = moment([
                values.year,
                values.month,
                values.day,
                values.hour,
                values.minute,
                values.second
            ]);

            //highlight invalid date
            this.highlight(dt);

            format = format === undefined ? this.options.format : format;
            if (format === null) {
                return dt.isValid() ? dt : null;
            } else {
                return dt.isValid() ? dt.format(format) : '';
            }
        },

        setValue: function (value) {
            if (!value) {
                return;
            }

            // parse in strict mode (third param `true`)
            var dt = typeof value === 'string' ? moment(value, this.options.format, true) : moment(value),
                that = this,
                values = {};

            //function to find nearest value in select options
            function getNearest($select, value) {
                var delta = {};
                $select.children('option').each(function (i, opt) {
                    var optValue = $(opt).attr('value'),
                        distance;

                    if (optValue === '') return;
                    distance = Math.abs(optValue - value);
                    if (typeof delta.distance === 'undefined' || distance < delta.distance) {
                        delta = {
                            value: optValue,
                            distance: distance
                        };
                    }
                });
                return delta.value;
            }

            if (dt.isValid()) {
                //read values from date object
                $.each(this.map, function (k, v) {
                    if (k === 'ampm') {
                        return;
                    }
                    values[k] = dt[v[1]]();
                });

                if (this.$ampm) {
                    //12:00 pm --> 12:00 (24-h format, midday), 12:00 am --> 00:00 (24-h format, midnight, start of day)
                    if (values.hour >= 12) {
                        values.ampm = 'pm';
                        if (values.hour > 12) {
                            values.hour -= 12;
                        }
                    } else {
                        values.ampm = 'am';
                        if (values.hour === 0) {
                            values.hour = 12;
                        }
                    }
                }

                $.each(values, function (k, v) {
                    //call val() for each existing combo, e.g. this.$hour.val()
                    if (that['$' + k]) {

                        if (k === 'minute' && that.options.minuteStep > 1 && that.options.roundTime) {
                            v = getNearest(that['$' + k], v);
                        }

                        if (k === 'second' && that.options.secondStep > 1 && that.options.roundTime) {
                            v = getNearest(that['$' + k], v);
                        }

                        that['$' + k].val(v);
                    }
                });

                // update days count
                if (this.options.smartDays) {
                    this.fillCombo('day');
                }

                this.$element.val(dt.format(this.options.format)).change();
                this.datetime = dt;
            } else {
                this.datetime = null;
            }
        },

        /*
         highlight combos if date is invalid
        */
        highlight: function (dt) {
            if (!dt.isValid()) {
                if (this.options.errorClass) {
                    this.$widget.addClass(this.options.errorClass);
                } else {
                    //store original border color
                    if (!this.borderColor) {
                        this.borderColor = this.$widget.find('select').css('border-color');
                    }
                    this.$widget.find('select').css('border-color', 'red');
                }
            } else {
                if (this.options.errorClass) {
                    this.$widget.removeClass(this.options.errorClass);
                } else {
                    this.$widget.find('select').css('border-color', this.borderColor);
                }
            }
        },

        leadZero: function (v) {
            return v <= 9 ? '0' + v : v;
        },

        destroy: function () {
            this.$widget.remove();
            this.$element.removeData('combodate').show();
        }

        //todo: clear method
    };

    $.fn.combodate = function (option) {
        var d, args = Array.apply(null, arguments);
        args.shift();

        //getValue returns date as string / object (not jQuery object)
        if (option === 'getValue' && this.length && (d = this.eq(0).data('combodate'))) {
            return d.getValue.apply(d, args);
        }

        return this.each(function () {
            var $this = $(this),
                data = $this.data('combodate'),
                options = typeof option == 'object' && option;
            if (!data) {
                $this.data('combodate', (data = new Combodate(this, options)));
            }
            if (typeof option == 'string' && typeof data[option] == 'function') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.combodate.defaults = {
        //in this format value stored in original input
        format: 'DD-MM-YYYY HH:mm',
        //in this format items in dropdowns are displayed
        template: 'D / MMM / YYYY   H : mm',
        //initial value, can be `new Date()`
        value: new Date(),
        minYear: 1970,
        maxYear: 2022,
        yearDescending: true,
        minuteStep: 5,
        secondStep: 1,
        firstItem: 'none', //'name', 'empty', 'none'
        errorClass: null,
        customClass: '',
        roundTime: true, // whether to round minutes and seconds if step > 1
        smartDays: true, // whether days in combo depend on selected month: 31, 30, 28
    };
    //totNoBlanks enters 15 minutes into the time on task field if the field is blank. If there is a number already recorded in the field, it will increase that time by 15 minutes.
    // This is to gaurantee that time by the user is recorded. it can be overridden by the user entering their time manually.

        function totNoBlanks() {
        var totValue = document.getElementById('sc_task.u_time_on_task').getAttribute('value');
        var totValue2 = parseInt(document.getElementById('sc_task.u_time_on_task').getAttribute('value'));
        var totValueFinal = 0;
        var addTime = 15;
            var timeBase = "15";

            if (totValue == ""){
                document.getElementById('sc_task.u_time_on_task').value = 15;
            } else {
                totValueFinal = totValue2 + addTime;
                document.getElementById('sc_task.u_time_on_task').value = totValueFinal;
            }
    }

     //Below is the script that enters the data into the ticket.
    setTimeout(function () {
        var titlePage = document.title;
            if (titlePage[0] == "T") {
                totNoBlanks();

            } else if (titlePage[0] == "I") {

            }

        //Different Codes:
        //Adds in customer comments on incidents

        var op = '<option value="AWCU">Awaiting Customer</option><option value="AWEQ">Awaiting Equipment</option><option value="AWVP">Awaiting Vendor Parts</option><option value="CETA">Appointment Scheduled "Today"</option><option value="CNRC">Could Not Reach Customer</option><option value="DNSL">Device De-Install</option><option value="IPRO">In Progress</option><option value="INSL">New Device Installed</option><option value="MOVE">Device Move</option><option value="REMR">Remotely Resolved</option><option value="RSGN">Reassigned Ticket</option><option value="RSLV">Resolved Ticket</option><option value="SCHD">Scheduled for Future Date</option><option value="WUE">Whole Unit Exchange</option>';

        //Adds the menu
        $('.activity_table').before(
            '<div id="StatusCodeSelector" style="text-align:center; border: grey solid 1px; max-width:900px; margin:auto; margin-bottom:20px;"><select id="selector" style="margin: 20px;">' +
            op +
            '</select><span style="font-size:18px; vertical-align:middle;">DATE:</span>&nbsp;<input type="text" id="dateinput" data-format="YY/MM/DD" data-template="YY / M / D">&nbsp;&nbsp;<span style="font-size:18px; vertical-align:middle;">TIME:</span>&nbsp;<input type="text" id="timeinput" data-format="HHmm" data-template="H : mm">&nbsp;&nbsp;&nbsp;<input id="testbut" type="button" value="Input Data"" /></div>'
        );
        $('#selector').change(function () {
            var val = $('#selector').val();

            //Options will default to today:
            if (
                val == 'IPRO' ||
                val == 'RSLV' ||
                val == 'WUE' ||
                val == 'REMR' ||
                val == 'RSGN' ||
                val == 'DNSL') {
                setToday();
            }
            var titlePage = document.title;
            if (titlePage[0] == "I") {
                var getfullname = document.getElementById('sys_display.original.incident.assigned_to').getAttribute('value');
                var incidentnumber = document.getElementById('sys_readonly.incident.number').getAttribute('value');
            } else if (titlePage[0] == "T") {
                var getfullname = document.getElementById('sys_display.sc_task.assigned_to').getAttribute('value');
                var incidentnumber = document.getElementById('sys_readonly.sc_task.number').getAttribute('value');
                totNoBlanks();
            }
            var name = getfullname.split(' ').slice(0, 2).reverse().join(' ').replace(',', '');

            var CustomerComment = "Hello: My name is " + name + " and I was the technician that assisted you with " + incidentnumber + ". Thank you for the opportunity to provide you with service today. If for any reason your issue does not appear to be resolved, please contact the Service Desk at (269) 226-5386.";

            //Update the state to Fulfilled/Resolved
            if (val == 'RSLV') {
                if (document.getElementById('sc_task.state')) {
                    document.getElementById('sc_task.state').value = 4;
                } else {
                    document.getElementById('incident.incident_state').value = 6;
                }

                $('#activity-stream-comments-textarea').val(CustomerComment);
            }
            if (val == 'IPRO') {
                if (document.getElementById('sc_task.state')) {
                    document.getElementById('sc_task.state').value = 2;
                } else {
                    document.getElementById('incident.incident_state').value = 2;
                }
            }
            if (val == 'WUE' || val == 'REMR' || val == 'MOVE' || val == 'INSL') {
                if (document.getElementById('sc_task.state')) {
                    document.getElementById('sc_task.state').value = 4;
                } else {
                    document.getElementById('incident.incident_state').value = 6;
                }
                //Adds in customer comments on incidents
                $('#activity-stream-comments-textarea').val(CustomerComment);
            }
            if (
                val == 'AWCU' ||
                val == 'AWEQ' ||
                val == 'AWVP' ||
                val == 'CETA' ||
                val == 'CNRC' ||
                val == 'SCHD'
            ) {
                if (document.getElementById('sc_task.state')) {
                    document.getElementById('sc_task.state').value = 3;
                    //totNoBlanks();
                } else {
                    document.getElementById('incident.incident_state').value = 4;
                }
            }
        });
        //Checks for click function. Once clicked updates the work notes with the values in the menu
        $(document).ready(function () {
            $('#testbut').click(function () {
                test12();
            });
        });
        //Loads in the datepicker
        // returns the year (four digits)
        var MinYearV = new Date().getFullYear()
        $('#dateinput').combodate({
            minYear: MinYearV,
            maxYear: MinYearV + 1,
        });
        //Loads in the timepicker
        $('#timeinput').combodate({
            minuteStep: 15,
        });
    });
})();
//Adds zero for time
function addZero(i) {
    if (i < 10) {
        i = '0' + i;
    }
    return i;
}
//function that inputs data into work notes
function test12() {
    var test1 =
        $('#dateinput').val() + ' ' + $('#selector').val() + ' ' + $('#timeinput').val() + ' ET';
    $('#activity-stream-work_notes-textarea').val(test1);
    if (document.getElementById('sc_task.u_desktop_status')) {
        document.getElementById('sc_task.u_desktop_status').value = test1;
    } else {
        document.getElementById('incident.u_desktop_status').value = test1;
		document.getElementById('wm_task.short_description').value;
    }
    var val = $('#selector').val();
    if ( val == 'AWCU' ) {
        if (document.getElementById('sc_task.state')) {
            document.getElementById('sc_task.state').value = 3;

        } else {
            document.getElementById('incident.incident_state').value = 4;
        }
    }

}
//Sets todays date
function formatDate(d) {
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear().toString().substr(2, 2);

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('/');
}

var firstCIWhole = document.getElementById('sys_display.incident.cmdb_ci').getAttribute('value');
var firstCI = firstCIWhole.slice(0, 8);
var secondCIWhole = document.getElementById('sys_display.incident.u_secondary_ci').getAttribute('value');
var secondCI = secondCIWhole.slice(0, 8);
/*var totValue = document.getElementById('sc_task.u_time_on_task').getAttribute('value'); */

function setToday() {
    var now = new Date();
    var xds = addZero(now.getHours()) + '' + addZero(now.getMinutes());
    var val = $('#selector').val();
    if (val == "WUE") {
        var enter = formatDate(now) + ' ' + $('#selector').val() + ' ' + xds + ' ET ' + secondCI;

    } else {
        var enter = formatDate(now) + ' ' + $('#selector').val() + ' ' + xds + ' ET ';

    }
    var test1 =
            $('#dateinput').val() + ' ' + $('#selector').val() + ' ' + $('#timeinput').val() + ' ET ';
    $('#activity-stream-work_notes-textarea').val(enter);

    var enterDS = formatDate(now) + ' ' + $('#selector').val() + ' ' + xds + ' ET ';

    if (document.getElementById('sc_task.u_desktop_status')) {
        document.getElementById('sc_task.u_desktop_status').value = enterDS;
    } else {
        document.getElementById('incident.u_desktop_status').value = enter;
    }
};
