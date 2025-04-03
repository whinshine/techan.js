'use strict';

module.exports = function(d3_behavior_drag, d3_event, d3_select, d3_functor, d3_mouse, d3_dispatch, accessor_trade, plot, plotMixin, svg_arrow) {  // Injected dependencies
  return function() { // Closure function
    var p = {},  // Container for private, direct access mixed in variables
        dispatch = d3_dispatch('mouseenter', 'mouseover', 'mouseout', 'drag', 'dragstart', 'dragend', 'selected', 'unselected'),
        y = function(d) { return p.yScale(p.accessor.p(d)); },
        svgArrow = svg_arrow().orient('up').tail(false);
    var versatileData = [];

    function comment(g) {
      var group = p.dataSelector(g);

      group.entry.append('g').attr('class', 'comment').append('path');
      var interaction = group.entry.append('g').attr('class', 'interaction').style('fill', 'none');
      interaction.append('path');
      comment.refresh(g);
    }

    comment.refresh = function(g) {
      refresh(p.dataSelector.select(g));
    };

    function refresh(selection) {
      selection.select('.comment path').classed('comment',true)
        .each(function(d) {
          var d1 = fillData(d);
          d3_select(this).datum(d1).attr('d', svgArrow);
        });
      selection.select('.interaction path').classed('comment', true)
        .each(function(d) {
          var d1 = fillData(d);
          d3_select(this).datum(d1).attr('d', svgArrow);
        })
        .on('mouseenter', function(data) {
          d3_select(this).classed('highlighted', true);
          dispatch.call('mouseenter', this, data);
        })
        .on('mouseover', function(data) {
          d3_select(this).classed('highlighted', true);
          dispatch.call('mouseover', this, data);
        })
        .on('mouseout', function(data) {
          d3_select(this).classed('highlighted', false);
          dispatch.call('mouseout', this, data);
        })
        .on('click', function(data) {
          if (d3_select(this).classed('selected')) {
            d3_select(this).classed('selected', false);
            dispatch.call('unselected', this, data);
          } else {
            d3_select(this).classed('selected', true);
            dispatch.call('selected', this, data);
          }
        });
    }

    comment.drag = function(g) {
      g.selectAll('.interaction path.comment')
        .call(dragBody(dispatch, p.accessor, p.xScale));
    };

    function dragBody(dispatch, accessor, x) {
      var drag = d3_behavior_drag().subject(function(d) {
        return { x: x(accessor.d(d)), y: 0 };
      })
      .on('drag', function(d) {
        var value = x.invert(d3_event().x),
            g = d3_select(this.parentNode.parentNode); // Go up to the selected items parent only (not the list of items)

        accessor.nd(d, value);
        refresh(g, accessor);
        dispatch.call('drag', this, d);
      });

      return plot.interaction.dragStartEndDispatch(drag, dispatch);
    }

    /**
     * Pass through straight to `techan.svg.arrow`.
     *
     * Since all plotted trades are plotted as grouped `type`s, ensure for every trade `type` input a definition of orient exists.
     * If there is an undefined orient definition for trade type, you will probably get an error.
     *
     * default is "buy" => "up", "sell" => "down"
     *
     * @param _ Either a constant or function that returns the orientation of the rendered arrow. Ensure for every input type
     *          a corresponding `techan.svg.arrow` orient value is returned.
     */
     comment.orient = function(_) {
      if(!arguments.length) return svgArrow.orient();
      svgArrow.orient(_);
      return binder();
    };

    /**
     * Define the way y position of the arrow is determined. Useful if required to show under or over OHLC quotes. Defaults
     * to showing the arrow on the trade price value.
     */
     comment.y = function(_) {
      if(!arguments.length) return y;
      y = d3_functor(_);
      return binder();
    };

    /**
     * Direct access to the underlying arrow
     */
     comment.arrow = function() {
      return svgArrow;
    };

    comment.stockData = function(data) {
      versatileData = data;
    };

    function fillData(d) {
      if (versatileData[d.date] !== undefined) {
        d.price = versatileData[d.date].low;
        d.low = versatileData[d.date].low;
        d.high = versatileData[d.date].high;
      }
      return d;
    }

    function binder() {
      svgArrow.x(function(d) { return p.xScale(p.accessor.d(d)); }).y(y);
      return comment;
    }

    // Mixin 'superclass' methods and variables
    plotMixin(comment, p).plot(accessor_trade(), binder).on(dispatch).dataSelector(plotMixin.dataMapper.unity);
    binder();

    return comment;
  };
};