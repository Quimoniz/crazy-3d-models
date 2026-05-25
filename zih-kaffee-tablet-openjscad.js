
/**
 * 3D Primitives Demonstration
 * @category Creating Shapes
 * @skillLevel 1
 * @description Demonstrating the basics of a variety of 3D primitives
 * @tags cube, cuboid, sphere, ellipsoid, cylinder, torus, shape, 3d
 * @authors Rene K. Mueller, Moissette Mark, Simon Clark
 * @licence MIT License
 */

const jscad = require('@jscad/modeling')
const { cube, cuboid, cylinder, cylinderElliptic, ellipsoid, geodesicSphere, roundedCuboid, roundedCylinder, sphere, torus } = jscad.primitives
const { translate, rotate, scale } = jscad.transforms
const { subtract, union } = jscad.booleans
const { hull } = require('@jscad/modeling').hulls;

const getScrewhole = function (taperLength = 4.5, cylinderLength = 30, cylinderSize = 4.5, backSize = 4.5, frontSize = 8.5, slice = 0.1) {

  const diamondSlice = (x, size) =>
    translate(
      [x, 0, 0],
      rotate(
        [Math.PI * 0.25, 0, Math.PI],
        cuboid({ size: [slice, size, size] })
      )
    );

  return union(
    translate(
	  [cylinderLength*-0.5],
      rotate(
	    [Math.PI * 0.25],
	    cuboid({size:[cylinderLength, cylinderSize, cylinderSize]})
	  )),
    hull(
      diamondSlice(-taperLength / 2, backSize),
      diamondSlice( taperLength / 2, frontSize)
  ));
};

const main = () => {
  const tabletClearance = 0.5;
  const holderWidth = 160;
  const tabletAngle = Math.PI*-0.125;
  const tabletHeight = 230;
  const tabletWidth = 170;
  const mountheight = 100;
  let tabletBox = scale(
    [0.7, 1.0, 1.0],
	roundedCuboid({ size: [8.1, tabletWidth + tabletClearance*2, tabletHeight + tabletClearance*2], roundRadius: 4, segments: 32 }));
	
  tabletBox = union(
    tabletBox,
	translate([1.6, 0, 0], cuboid({
		size: [4, tabletWidth+ tabletClearance*2, tabletHeight + tabletClearance*2 - 0.1]
	})));
  tabletBox = translate(
    [2, 0, 0],
	tabletBox
  );
  let tabletFrontSpacer = translate([10, 0, 0], cuboid({size: [16, tabletWidth, tabletHeight-10]}));
  let tabletBackPlane = roundedCuboid({size: [24, holderWidth, tabletHeight + 10], roundRadius: 1, segments: 10})
  tabletBackPlane = subtract(tabletBackPlane, tabletBox);
  tabletBackPlane = subtract(tabletBackPlane, tabletFrontSpacer);
  tabletBackPlane = rotate(
    [0, tabletAngle, 0],
    tabletBackPlane
  );
  let microUsbHole = translate(
    [-47, 0, 120],
    rotate(
      [0, tabletAngle, 0],
      roundedCuboid({
        size: [9.2, 12, 40],
        roundRadius: 1,
        segments: 8
    })));
  microUsbHole = union(
    microUsbHole,
	translate(
	  [-45.5, -14, 115.5],
	  rotate([0, tabletAngle, 0],
	    roundedCuboid({ size: [10, 40, 15], roundRadius: 2, segments: 32})
	)));
  tabletBackPlane = subtract(
    tabletBackPlane,
    microUsbHole
  );
  
  // The Wall-Mounting Bracket
  let mountingBracket = translate(
    [-40, 0, 50],
    cuboid({size: [60, holderWidth, mountheight]})
  );
  mountingBracket = subtract(
    mountingBracket,
    translate(
      [0, 0, 40],
      rotate(
        [0, tabletAngle, 0],
        cuboid({
          size: [50, holderWidth, mountheight+100]
    }))));
  let fullHolder = union(
    tabletBackPlane,
    mountingBracket
  );
  let spaceForScrewdriver =
    translate(
      [-26, 0, 45],
      rotate(
        [Math.PI * 0.25, 0, 0],
        roundedCuboid({
          size: [65, 60, 60],
          roundRadius: 8,
          segments: 32
        })
      )
    );
  
  
  fullHolder = subtract(
    fullHolder,
    spaceForScrewdriver
  )
  
//  const getScrewhole = function () {
//      return rotate([Math.PI * 0.25, 0, 0], cuboid({size: [16, 4.5, 4.5]}));
//  };
  fullHolder = subtract(fullHolder, translate([-60, -21, 45], getScrewhole(4.5, 30, 4.5, 4.5, 9.5, 0.1)));
  fullHolder = subtract(fullHolder, translate([-60,  21, 45], getScrewhole(4.5, 30, 4.5, 4.5, 9.5, 0.1)));
  fullHolder = subtract(fullHolder, translate([-60,   0, 76], getScrewhole(4.5, 30, 4.5, 4.5, 9.5, 0.1)));
  fullHolder = subtract(fullHolder, translate([-60,   0, 14], getScrewhole(4.5, 30, 4.5, 4.5, 9.5, 0.1)));
  
  
  return [fullHolder]
}

module.exports = { main }

