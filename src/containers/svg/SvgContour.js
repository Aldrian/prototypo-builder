import React, { PureComponent, PropTypes } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';

import {
  forEachCurve,
} from '~/_utils/path';

import {
  getParentGlyphId,
} from '~/_utils/graph';

import {
  getCalculatedParams,
  getCalculatedGlyph,
} from '~/_utils/parametric';

import {
  lerp,
  rotateVector,
} from '~/_utils/math';

import {
  renderPathData,
  mapDispatchToProps,
  equalVec,
  addVec,
  subtractVec,
  multiplyVecByN,
  normalizeVec,
  dotProduct,
  outline,
  bezierOffset,
  getCurveOutline,
  rayRayIntersection,
  getTangentPoints,
} from './_utils';

class SvgContour extends PureComponent {
  constructor(props) {
    super(props);
    this.renderPathData = renderPathData.bind(this);
    this.renderChildren = this.renderChildren.bind(this);
  }

  renderChildren() {
    const { nodes, id } = this.props;
    const { childIds } = nodes[id];

    const result = childIds.map((pathId) => {
      return this.renderPathData(pathId);
    }).join(' ');
    return result;
  }

  renderExpandedSkeletons() {
    const { nodes, id } = this.props;
    const { childIds } = nodes[id];

    return (
      childIds
        .filter((pathId) => {
          return nodes[pathId].isSkeleton;
        })
        .map((pathId) => {

          const paths = [];
          forEachCurve(pathId, nodes, (c0, c1, c2, c3, i) => {
            let pathString = '';
            if (c2 && c3) {
              if (equalVec(c0, c1)) {
                const relC1 = subtractVec(c1._ghost, c0);
                relC1.x += 0.1;
                relC1.y += 0.1;
                c1 = addVec(c0, multiplyVecByN(relC1, 0.1));
              }
              if (equalVec(c2, c3)) {
                const relC2 = subtractVec(c2._ghost, c3);
                relC2.x += 0.1;
                relC2.y += 0.1;
                c2 = addVec(c3, multiplyVecByN(relC2, 0.1));
              }
              const curves = outline(c0, c1, c2, c3,
                                     (c0.expand || 20) * (c0.distrib || 0.5),
                                     (c0.expand || 20) * (1 - (c0.distrib || 0.5)),
                                     (c3.expand || 20) * (c3.distrib || 0.5),
                                     (c3.expand || 20) * (1 - (c3.distrib || 0.5))
                                    );
              curves.forEach((curve, i) => {
                if (pathString.length === 0) {
                  pathString += `M${curve.c0.x} ${curve.c0.y}`;
                }

                if (c0.isSmoothSkeleton && i === 1) {
                  const unitC1Vec = normalizeVec(subtractVec(c1, c0));
                  const newCurveC1 = multiplyVecByN(unitC1Vec, dotProduct(subtractVec(curve.c1, curve.c0), unitC1Vec));

                  curve.c1 = addVec(curve.c0, newCurveC1);
                }

                if (c0.isSmoothSkeleton && i === curves.length - 1) {
                  const unitC1Vec = normalizeVec(subtractVec(c1, c0));
                  const newCurveC2 = multiplyVecByN(unitC1Vec, dotProduct(subtractVec(curve.c2, curve.c3), unitC1Vec));

                  curve.c2 = addVec(curve.c3, newCurveC2);
                }

                if (c3.isSmoothSkeleton && i === curves.length / 2 + 1) {
                  const unitC1Vec = normalizeVec(subtractVec(c2, c3));
                  const newCurveC1 = multiplyVecByN(unitC1Vec, dotProduct(subtractVec(curve.c1, curve.c0), unitC1Vec));

                  curve.c1 = addVec(curve.c0, newCurveC1);
                }

                if (c3.isSmoothSkeleton && i === curves.length / 2 - 1) {
                  const unitC1Vec = normalizeVec(subtractVec(c2, c3));
                  const newCurveC2 = multiplyVecByN(unitC1Vec, dotProduct(subtractVec(curve.c2, curve.c3), unitC1Vec));

                  curve.c2 = addVec(curve.c3, newCurveC2);
                }

                pathString += ` C${curve.c1.x},${curve.c1.y} ${curve.c2.x},${curve.c2.y} ${curve.c3.x},${curve.c3.y}`;
              });
            }
            paths.push( <path d={pathString} key={`curve-${i}`}/>);
          });

          return paths;
        })
    );
  }
  drawInterpolatedTangents(c0, c1, c2, c3, steps, pathId, j) {
    let n, c, result = [];
    for (let i = 1; i < steps; i++) {
      ({ n, c } = bezierOffset(c0, c1, c2, c3, i/steps, lerp(c0.expand, c3.expand, i/steps)));
      if (!Number.isNaN(n.x) && !Number.isNaN(c.x)) {
        n = rotateVector(n.x, n.y, lerp(c0.angle%360, c3.angle%360, i/steps));
        result.push (
          <path key={`tan-${pathId}${j}${i}`}
            id={`tan-${pathId}${j}${i}`}
            d={`M${c.x + n.x * (lerp(c0.distrib, c3.distrib, i/steps) * lerp(c0.expand, c3.expand, i/steps))}
                 ${c.y + n.y * (lerp(c0.distrib, c3.distrib, i/steps) * lerp(c0.expand, c3.expand, i/steps))}
            L${c.x - n.x * ((1 - lerp(c0.distrib, c3.distrib, i/steps)) * lerp(c0.expand, c3.expand, i/steps))}
             ${c.y - n.y * ((1 - lerp(c0.distrib, c3.distrib, i/steps)) * lerp(c0.expand, c3.expand, i/steps))}`}
            stroke="#ff00ff"
            />
        );
      }
    }
    return result;
  }
  drawCatmullOutline(c0, c1, c2, c3, steps) {
    return getCurveOutline(c0,c1,c2,c3,steps);
  }
  drawSimpleOutline(c0,c1,c2,c3, c0tanIn, c3tanIn, c0tanOut, c3tanOut, beta1, beta2, pathId, j) {
    let result = [];
    const c0c1Inray = {point: c0tanIn, angle: (Math.atan2(c1.y - c0.y, c1.x - c0.x))}
    const c2c3Inray = {point: c3tanIn, angle: (Math.atan2(c2.y - c3.y, c2.x - c3.x))}
    const intersectIn = {}, c0tanInCurve = {}, c3tanInCurve = {};
    [intersectIn.x, intersectIn.y] = rayRayIntersection(c0c1Inray.point, c0c1Inray.angle, c2c3Inray.point, c2c3Inray.angle);
    c0tanInCurve.x = c0tanIn.x + (intersectIn.x - c0tanIn.x) * beta1;
    c0tanInCurve.y = c0tanIn.y + (intersectIn.y - c0tanIn.y) * beta1;
    c3tanInCurve.x = c3tanIn.x + (intersectIn.x - c3tanIn.x) * beta1;
    c3tanInCurve.y = c3tanIn.y + (intersectIn.y - c3tanIn.y) * beta1;
    result.push(
      <path key={`inBezier-${pathId}${j}`}
        id={`inBezier-${pathId}${j}`}
        d={`M ${c0tanIn.x},${c0tanIn.y}
            C ${c0tanInCurve.x},${c0tanInCurve.y}
              ${c3tanInCurve.x},${c3tanInCurve.y}
              ${c3tanIn.x},${c3tanIn.y}
          `}
        stroke="#00ff00" strokeWidth="2" fill="transparent"
        />
    );
    const c0c1Outray = {point: c0tanOut, angle: (Math.atan2(c1.y - c0.y, c1.x - c0.x))}
    const c2c3Outray = {point: c3tanOut, angle: (Math.atan2(c2.y - c3.y, c2.x - c3.x))}
    const intersectOut = {}, c0tanOutCurve = {}, c3tanOutCurve = {};
    [intersectOut.x, intersectOut.y] = rayRayIntersection(c0c1Outray.point, c0c1Outray.angle, c2c3Outray.point, c2c3Outray.angle);
    c0tanOutCurve.x = c0tanOut.x + (intersectOut.x - c0tanOut.x) * beta2;
    c0tanOutCurve.y = c0tanOut.y + (intersectOut.y - c0tanOut.y) * beta2;
    c3tanOutCurve.x = c3tanOut.x + (intersectOut.x - c3tanOut.x) * beta2;
    c3tanOutCurve.y = c3tanOut.y + (intersectOut.y - c3tanOut.y) * beta2;
    result.push(
      <path key={`outBezier-${pathId}${j}`}
        id={`outBezier-${pathId}${j}`}
        d={`M ${c0tanOut.x},${c0tanOut.y}
            C ${c0tanOutCurve.x},${c0tanOutCurve.y}
              ${c3tanOutCurve.x},${c3tanOutCurve.y}
              ${c3tanOut.x},${c3tanOut.y}
          `}
        stroke="#00ff00" strokeWidth="2" fill="transparent"
        />
    );
    return result;
  }
  renderOutline() {
    const { nodes, id, ui } = this.props;
    const { childIds } = nodes[id];
    const contourMode = ui.contourMode || 'catmull';
    const drawInterpolatedTangents = ui.showInterpolatedTangents || false;
    return (
      childIds
        .filter((pathId) => {
          return nodes[pathId];
        })
        .map((pathId) => {
          let result = [];
          let inContour = '', outContour = '';
          // draw tangents
          let j = 0, steps = 10,
          beta1 = 0.55, beta2 = 0.65;
          forEachCurve(pathId, nodes, (c0, c1, c2, c3) => {
            if (c2 && c3) {
              if (drawInterpolatedTangents) {
                result.push(this.drawInterpolatedTangents(c0, c1, c2, c3, steps, pathId, j));
              }
              j++;
              if (contourMode === 'catmull') {
                inContour += this.drawCatmullOutline(c0, c1, c2, c3, steps, pathId, j).inContour;
                outContour = this.drawCatmullOutline(c0, c1, c2, c3, steps, pathId, j).outContour + outContour;
              }
              if (c1._isGhost) {
                c1.x = c1._ghost.x;
                c1.y = c1._ghost.y;
              }
              if (c2._isGhost) {
                c2.x = c2._ghost.x;
                c2.y = c2._ghost.y;
              }
              const c0tangents = getTangentPoints(c0, c1);
              const c3tangents = getTangentPoints(c3, c2);
              if (contourMode === 'simple' && c3tangents.in && c0tangents.in) {
                inContour += this.drawSimpleOutline(c0,c1,c2,c3, c0tangents.out, c3tangents.in, c0tangents.in, c3tangents.out, beta1, beta2, pathId, j);
              }
            }
          });
        if (contourMode === 'catmull') {
          result.push(
            <polyline key={`inContour-${pathId}`}
            id={`inContour-${pathId}`}
            points={inContour + ' ' + outContour}
            stroke={nodes[id].isClosed ? 'transparent' : 'rgb(255,20,90)'}
            fill={nodes[id].isClosed ? 'black' : 'transparent'}
            strokeWidth="2"
            fillRule="nonzero"
            />
          );
        }
        else if (contourMode === 'simple') {
          result.push(
            <path key={`outBezier-${pathId}${j}`}
              id={`outBezier-${pathId}${j}`}
              d={inContour}
              stroke="#00ff00" strokeWidth="2" fill="transparent"
              />
          );
        }
        return result;
        })
      );
  }

  render() {
    const classes = classnames({
      contour: true,
    });
    return (
      <g>
        <path className={classes} d={this.renderChildren()} />
        {this.renderExpandedSkeletons()}
        {this.renderOutline()}
      </g>
    );
  }
}

SvgContour.propTypes = {
  actions: PropTypes.object.isRequired,
}

function mapStateToProps(state, props) {
  return {
    nodes: getCalculatedGlyph(
      state,
      getCalculatedParams(state.nodes.font_initial.params),
      getParentGlyphId(state.nodes, props.id)
    ),
    ui: state.ui,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SvgContour);
