'use strict';

module.exports = function(d3_behavior_drag, d3_event, d3_select, d3_dispatch, accessor_stopline, plot, plotMixin) {  // Injected dependencies
  function Stopline() { // Closure function
    var p = {},  // Container for private, direct access mixed in variables
        dispatch = d3_dispatch('mouseenter', 'mouseout', 'mousemove', 'drag', 'dragstart', 'dragend', 'selected', 'unselected', 'cutoff'),
        annotationComposer = plot.plotComposer().scope('composed-annotation').plotScale(function(plot) { return plot.axis().scale(); }),
        tooltip;

    function stopline(g) {
      var group = p.dataSelector(g);

      group.entry.append('g').attr('class', 'stopline')
        .append('path');

      group.entry.append('g').attr('class', 'axisannotation y').call(annotationComposer);

      var interaction = group.entry.append('g').attr('class', 'interaction').style('opacity', 0).style('fill', 'none' )
        .call(mousedispatch(dispatch));

      interaction.append('path').style('stroke-width', '8px');
      interaction.append('circle').attr('class', 'end').attr('r', 8);
      tooltip = d3_select('body>.stopline.tooltip');
      if (tooltip.empty()) {
        tooltip = d3_select('body').append("div")	.attr("class", "stopline tooltip").style("opacity", 0);
      }
      stopline.refresh(g);
    }

    stopline.drag = function(g) {
      g.selectAll('.stopline .interaction .end').call(dragEnd(dispatch));
    };

    function dragEnd(dispatch) {
      var drag = d3_behavior_drag();

      drag.subject(function(d) {
        return {x: d3_event().x, y: 0};
      })
      .on('drag', function(d) {
        var date1 = p.xScale.invert(d3_event().x),
            len = p.accessor.sz(d),
            value = p.accessor.v(d),
            preprice = value[len -1].price;
          if (preprice !== undefined) {
            if (len === 1) {
              p.accessor.v(d, {date: date1, price: preprice});
            } else if (len > 1) {
              if (value[len-1].price !== value[len-2].price) {
                p.accessor.v(d, {date: date1, price: preprice});
              } else {
                p.accessor.c(d);
                p.accessor.v(d, {date: date1, price: preprice});
              }
            }
            d3_select(this.parentNode.parentNode).select('.stopline path').attr('d', stoplinePath(p.accessor, p.xScale, p.yScale));
            d3_select(this.parentNode.parentNode).select('.interaction path').attr('d', stoplinePath(p.accessor, p.xScale, p.yScale));
            d3_select(this.parentNode.parentNode).select('.axisannotation.y').call(annotationComposer.refresh);
            d3_select(this.parentNode.parentNode).select('circle.end').attr('cx', stoplineEndCX(d, p.xScale)).attr('cy', stoplineEndCY(d, p.yScale));
          }
        dispatch.call('drag', this, d);
      });

      return plot.interaction.dragStartEndDispatch(drag, dispatch);
    }

    stopline.refresh = function(g) {
      refresh(p.dataSelector.select(g), p.accessor, p.xScale, p.yScale, annotationComposer);
    };

    stopline.annotation = function(_) {
      if(!arguments.length) return annotationComposer.plots();
      annotationComposer.plots(_ instanceof Array ? _ : [_]);
      return stopline;
    };

    function refresh(selection, accessor, x, y, annotationComposer) {
      selection.each(function(d) {
        // accessor.r(d, accessor.r(d));
        d3_select(this).select('.stopline path').attr('d', stoplinePath(accessor, x, y));
        d3_select(this).select('.interaction path').attr('d', stoplinePath(accessor, x, y));
        d3_select(this).select('.axisannotation.y').call(annotationComposer.refresh);
        d3_select(this).select('circle.end').attr('cx', stoplineEndCX(d, x)).attr('cy', stoplineEndCY(d, y));
      });
    }

    function stoplineEndCX(d, x) {
      var len = p.accessor.sz(d),
          value = p.accessor.v(d),
          xRange = x.range();
      if (len === 1) {
        return xRange[1];
      } else if (len > 1) {
        if (value[len-1].price !== value[len-2].price) {
          return xRange[1];
        } else {
          return x(value[len-1].date);
        }
      }
    }

    function stoplineEndCY(d, y) {
      var len = p.accessor.sz(d),
          value = p.accessor.v(d);
      return y(value[len-1].price);
    }

    function mousedispatch(dispatch) {
      return function(selection) {
        return selection.on('mouseenter', function(d) {
          d3_select(this.parentNode).classed('mouseover', true);
          dispatch.call('mouseenter', this, d);
        })
        .on('mouseleave', function(d) {
          tooltip.transition().duration(100).style("opacity", 0);
          var parentElement = d3_select(this.parentNode);
          if(!parentElement.classed('dragging')) {
            parentElement.classed('mouseover', false);
            dispatch.call('mouseout', this, d);
          }
        })
        .on('mousemove', function(d) {
          var date = p.xScale.invert(d3.mouse(this)[0]),
            len = p.accessor.sz(d),
            value = p.accessor.v(d),
            stop;
          for (var i = len - 1; i >=0; i--) {
            if (date >= value[i].date) {
              stop = value[i].price;
              break;
            }
          }
          tooltip.transition()
              .duration(100)
              .style("opacity", 0.9);
          tooltip.html("&nbsp;stop: " + stop)
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY) + "px");
          dispatch.call('mousemove', this, d);
        })
        .on('click', function(d) {
          var parentElement = d3_select(this.parentNode);
          if(!parentElement.classed('selected')) {
            parentElement.classed('selected', true);
            dispatch.call('selected', this, d);
          } else {
            parentElement.classed('selected', false);
            dispatch.call('unselected', this, d);
          }
        })
        .on('dblclick', function(d) {
          var date1 = p.xScale.invert(d3.mouse(this)[0]),
              len = p.accessor.sz(d),
              value = p.accessor.v(d),
              preprice;
          if (date1 > value[len - 1].date) {
            preprice = value[len -1].price;
          } else if (len > 2 && value[len-1].price === value[len -2].price && date1 > value[len -2].date) {
            preprice = value[len -2].price;
            p.accessor.c(d);
          }
          if (preprice !== undefined) {
            p.accessor.v(d, {date: date1, price: preprice});
            d3_select(this.parentNode).select('.stopline path').attr('d', stoplinePath(p.accessor, p.xScale, p.yScale));
            d3_select(this.parentNode).select('.interaction path').attr('d', stoplinePath(p.accessor, p.xScale, p.yScale));
            d3_select(this.parentNode).select('.axisannotation.y').call(annotationComposer.refresh);
            d3_select(this.parentNode).select('circle.end').attr('cx', stoplineEndCX(d, p.xScale)).attr('cy', stoplineEndCY(d, p.yScale));
            dispatch.call('cutoff', this, d);
          }
        });
      };
    }

    function stoplinePath(accessor, x, y) {
      return function(d) {
        var path = '', value;
        var xRange = x.range();
        if (accessor.sz(d) > 0) {
          value = accessor.v(d);
          path += ('M ' + x(value[0].date) + ' ' + y(value[0].price));
          for (var i = 0,len = accessor.sz(d); i < len; ++i) {
            if (i === len - 1) {
              if (len >= 2 && value[i].price === value[i-1].price) {
                //do nothing;
              }else {
                path += (' L ' + xRange[1] + ' ' + y(value[i].price));
              }
            } else {
              path += (' L ' + x(value[i+1].date) + ' ' + y(value[i].price) +
                ' L ' + x(value[i+1].date) + ' ' + y(value[i+1].price));
            }
          }
        }
        return path;
      };
    }

    function binder() {
      annotationComposer.accessor(p.accessor.v).scale(p.yScale);
      return stopline;
    }

    // Mixin 'superclass' methods and variables
    plotMixin(stopline, p)
      .dataSelector(plotMixin.dataMapper.unity)
      .plot(accessor_stopline(), binder)
      .on(dispatch);

    // Further group configuration now that it's mixed in
    // Supstance is composed of annotations, we need to scope the group selection
    p.dataSelector.scope('stopline');

    return binder();
  }

  return Stopline;
};
