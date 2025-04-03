'use strict';

module.exports = function() {
  var size = function(d) { return d === undefined?0: (d.value === undefined?0: d.value.length); },
      start = function(d) { return d.value[0]; },
      end = function(d) {return d.value[size(d.value) - 1];},
    /**
     * Supports getter and setter
     * type: type
     * rate : rate
     * rawdata : array of {date: date, open: open, close: close}
     * value : array of {date: date, price : price}
     * @param d Underlying data object to get or set the value
     * @param _ If passed turns into a setter. This is the value to set
     * @returns {*}
     */
    value = function(d, _) {
      if(arguments.length < 2) return d.value;
      d.value.push(_);
      return accessor;
    },
    rawdata = function(d, _) {
      if(arguments.length < 2) return d.rawdata;
      d.rawdata.push(_);
      // if (d.type !== undefined && d.rate !== undefined) {
      //   updateValue(d);
      // }
      return accessor;
    },
    // rate = function(d, _) {
    //   if(arguments.length < 2) return d.rate;
    //   if (d.type !== undefined && d.rawdata !== undefined) {
    //     updateValue(d);
    //   }
    //   return accessor;
    // },
    cut = function(d) {
      if(!arguments.length) return accessor;
      d.value.pop();
      return accessor;
    },
    type = function(d, _) {
      if(arguments.length < 2) return d.type;
      // if (rate !== undefined && d.rawdata !== undefined) {
      //   updateValue(d);
      // }
      return accessor;
    };

    // function updateValue(d) {
    //   if (d.value === undefined || d.value.length == 0) {
    //     var type = d.type;
    //     var realRate = type === 'long'? (100 - d.rate) /100 : (100 + d.rate) /100;
    //     d.value = d.rawdata.map(function(d1) {
    //       var realValue = type === 'long'?Math.min(d1.open, d1.close): Math.max(d1.open, d1.close);
    //       return {
    //           date: d1.date,
    //           price: (realValue * realRate).toFixed(2)
    //       };
    //     });
    //   }
    // }

    function accessor(d) {
      return accessor.v(d);
    }

  accessor.start = function(_) {
    if (!arguments.length) return start;
    return bind();
  };

  accessor.end = function(_) {
    if (!arguments.length) return end;
    return bind();
  };

  accessor.value = function(_) {
    if (!arguments.length) return value;
    return bind();
  };

  function bind() {
    accessor.t = type;
    accessor.s = start;
    accessor.e = end;
    accessor.v = value;
    accessor.sz = size;
    accessor.c = cut;
    accessor.rd = rawdata;

    return accessor;
  }

  return bind();
};