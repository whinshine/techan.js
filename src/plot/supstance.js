'use strict';

module.exports = function(d3_behavior_drag, d3_event, d3_select, d3_dispatch, accessor_supstance, plot, plotMixin) {  // Injected dependencies
  function Supstance() { // Closure function
    var p = {},  // Container for private, direct access mixed in variables
        dispatch = d3_dispatch('mouseenter', 'mouseout', 'mousemove', 'drag', 'dragstart', 'dragend', 'selected', 'unselected'),
        annotationComposer = plot.plotComposer().scope('composed-annotation').plotScale(function(plot) { return plot.axis().scale(); }),
        tooltip;

    function supstance(g) {
      var group = p.dataSelector(g);

      group.entry.append('g').attr('class', 'supstance')
        .append('path');

      group.entry.append('g').attr('class', 'axisannotation y').call(annotationComposer);

      var interaction = group.entry.append('g').attr('class', 'interaction').style('opacity', 0).style('fill', 'none' )
        .call(mousedispatch(dispatch));

      interaction.append('path').style('stroke-width', '16px');
      tooltip = d3_select('body>.supstance.tooltip');
      if (tooltip.empty()) {
        tooltip = d3_select('body').append("div")	.attr("class", "supstance tooltip").style("opacity", 0);
      }
      supstance.refresh(g);
    }

    supstance.refresh = function(g) {
      refresh(p.dataSelector.select(g), p.accessor, p.xScale, p.yScale, annotationComposer);
    };

    supstance.drag = function(g) {
      g.selectAll('.interaction path').call(dragBody(dispatch, p.accessor, p.xScale, p.yScale, annotationComposer));
    };

    supstance.annotation = function(_) {
      if(!arguments.length) return annotationComposer.plots();
      annotationComposer.plots(_ instanceof Array ? _ : [_]);
      return supstance;
    };

    function binder() {
      annotationComposer.accessor(p.accessor.v).scale(p.yScale);
      return supstance;
    }

    function mousedispatch(dispatch) {
      return function(selection) {
        return selection.on('mouseenter', function(d) {
          tooltip.transition()
              .duration(100)
              .style("opacity", 0.9);
            tooltip.html("&nbsp;supstance: " + p.accessor.v(d))
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY) + "px");
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
        .on('mousemove', function(d) { dispatch.call('mousemove', this, d); })
        .on('click', function(d) {
          var parentElement = d3_select(this.parentNode);
          if(!parentElement.classed('selected')) {
            parentElement.classed('selected', true);
            dispatch.call('selected', this, d);
          } else {
            parentElement.classed('selected', false);
            dispatch.call('unselected', this, d);
          }
        });
      };
    }

    // Mixin 'superclass' methods and variables
    plotMixin(supstance, p)
      .dataSelector(plotMixin.dataMapper.unity)
      .plot(accessor_supstance(), binder)
      .on(dispatch);

    // Further group configuration now that it's mixed in
    // Supstance is composed of annotations, we need to scope the group selection
    p.dataSelector.scope('supstance');

    return binder();
  }

  function dragBody(dispatch, accessor, x, y, annotationComposer) {
    var drag = d3_behavior_drag().subject(function(d) {
      return { x: 0, y: y(accessor(d)) };
    })
    .on('drag', function(d) {
      var value = y.invert(d3_event().y),
          g = d3_select(this.parentNode.parentNode); // Go up to the selected items parent only (not the list of items)

      accessor.v(d, value);
      refresh(g, accessor, x, y, annotationComposer);
      dispatch.call('drag', this, d);
    });

    return plot.interaction.dragStartEndDispatch(drag, dispatch);
  }

  return Supstance;
};

function refresh(selection, accessor, x, y, annotationComposer) {
  selection.select('.supstance path').attr('d', supstancePath(accessor, x, y));
  selection.select('.interaction path').attr('d', supstancePath(accessor, x, y));
  selection.select('.axisannotation.y').call(annotationComposer.refresh);
}

function supstancePath(accessor, x, y) {
  return function(d) {
    var range;

    if(isSupstanceAccessor(accessor)) {
      range = [accessor.s(d), accessor.e(d)];
      range[0] = range[0] !== undefined ? x(range[0]) : x.range()[0];
      range[1] = range[1] !== undefined ? x(range[1]) : x.range()[1];
    }
    else range = x.range();

    return 'M ' + range[0] + ' ' + y(accessor(d)) +
      ' L ' + range[range.length-1] + ' ' + y(accessor(d));
  };
}

function isSupstanceAccessor(accessor) {
  return accessor.s !== undefined && accessor.e !== undefined;
}