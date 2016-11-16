// all available actions should be manually listed here
export default {
  _deleteNode: require('../actions/nodes/_deleteNode.js'),
  addChild: require('../actions/nodes/addChild.js'),
  addChildren: require('../actions/nodes/addChildren.js'),
  addContour: require('../actions/contours/addContour.js'),
  addCurve: require('../actions/paths/addCurve.js'),
  addFont: require('../actions/fonts/addFont.js'),
  addGlyph: require('../actions/glyphs/addGlyph.js'),
  addOffcurve: require('../actions/offcurves/addOffcurve.js'),
  addOncurve: require('../actions/oncurves/addOncurve.js'),
  addParam: require('../actions/params/addParam.js'),
  addPath: require('../actions/paths/addPath.js'),
  createContour: require('../actions/contours/createContour.js'),
  createCurve: require('../actions/paths/createCurve.js'),
  createFont: require('../actions/fonts/createFont.js'),
  createGlyph: require('../actions/glyphs/createGlyph.js'),
  createNode: require('../actions/nodes/createNode.js'),
  createOffcurve: require('../actions/offcurves/createOffcurve.js'),
  createOncurve: require('../actions/oncurves/createOncurve.js'),
  createPath: require('../actions/paths/createPath.js'),
  deleteFormula: require('../actions/formulas/deleteFormula.js'),
  deleteNode: require('../actions/nodes/deleteNode.js'),
  deleteParam: require('../actions/params/deleteParam.js'),
  deleteTmpFormula: require('../actions/ui/deleteTmpFormula.js'),
  loadImageData: require('../actions/ui/loadImageData.js'),
  loadNodes: require('../actions/nodes/loadNodes.js'),
  moveNode: require('../actions/nodes/moveNode.js'),
  removeChild: require('../actions/nodes/removeChild.js'),
  setContourSelected: require('../actions/ui/setContourSelected.js'),
  setCoords: require('../actions/mouse/setCoords.js'),
  setMouseState: require('../actions/mouse/setMouseState.js'),
  setNodeHovered: require('../actions/ui/setNodeHovered.js'),
  setNodeOptionsSelected: require('../actions/ui/setNodeOptionsSelected.js'),
  setNodeSelected: require('../actions/ui/setNodeSelected.js'),
  setPathHovered: require('../actions/ui/setPathHovered.js'),
  setPathSelected: require('../actions/ui/setPathSelected.js'),
  updateCoords: require('../actions/points/updateCoords.js'),
  updateFormula: require('../actions/formulas/updateFormula.js'),
  updateParam: require('../actions/params/updateParam.js'),
  updateProp: require('../actions/props/updateProp.js'),
  updateTmpFormula: require('../actions/ui/updateTmpFormula.js'),
  updateX: require('../actions/points/updateX.js'),
  updateY: require('../actions/points/updateY.js'),
  setContourMode: require('../actions/ui/setContourMode.js'),
  setInterpolatedTangentsMode: require('../actions/ui/setInterpolatedTangentsMode.js'),
  setActiveTab: require('../actions/ui/setActiveTab.js'),
  setBaseExpand: require('../actions/ui/setBaseExpand.js'),
};
