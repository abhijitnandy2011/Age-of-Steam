/**
 * Circular track segment
 */
function CircularSegment(options){
    this.segmentType = SEGMENTTYPE.CIRCLE;

    // We always copy all options supplied to this object, creating keys as needed
    for(var k in options) this[k] = options[k];

    // If this.bankingFunction is specified, it will be used in this.getUpAxis(). 
    // For this this.endUpAxis is needed.

    // Calc reqd stuff
    this.segmentLength = this.radius * this.angle;
    this.unitvecStartRadius = this.startPoint.subtract(this.center).normalize();

    this.rotMatrix = new BABYLON.Matrix();
    this.quat = BABYLON.Quaternion.RotationAxis(this.normal, this.angle);
    this.quat.toRotationMatrix(this.rotMatrix);
    this.unitvecEndRadius = BABYLON.Vector3.TransformCoordinates(this.unitvecStartRadius, this.rotMatrix);

    this.endPoint = this.unitvecEndRadius.scale(this.radius);
    this.endPoint.addInPlace(this.center);

    if (this.startUpAxis == null) {
        console.error("A circular segment is either a 'plane' or convex/concave." + 
        "startUpAxis needs to be always specified.");
        return;
    }

    if (this.endUpAxis == null) {
        // No twist in upAxis, take account of bConvex & calc
        this.endUpAxis = this.getDefaultUpAxis(this.segmentLength);
        if (this.endUpAxis == null) {
            console.error("Could not calculate endUpAxis.");
            return;
        }
    }

    // List of points to draw this segment. We have amember to generate the points beforehand
    // We could postpone this and the mesh generation till the line actually needs drawing.
    // Note for a circle in 3D the points are dependent on the normal
    // We need basic vector math here
    this.pointList = [];
    this.normalPointList = [];
    this.upAxisPointList = [];
    this.generatePointList(Math.PI/60);

}

// Gets default upAxis which is the radial vector without twist for the convex case. Is based on distance covered on the segment as for the convex case, the 
// upAxis will change continuously.
// Doesnt use this.bankingFunction

CircularSegment.prototype.getDefaultUpAxis = function(distCovered)
{
    if (this.bConvex != null) {
        var pnt = this.getPointFromDistanceOnSegment(distCovered).pointOnSegment;
        if (pnt == null) {
            console.error("The passed distance is greater than this segment's length");
            return null;
        }
        var upAxis = this.center.subtract(pnt).normalize(); // pointing towards center
        if (this.bConvex) {
            // Convex hill
            upAxis = upAxis.negate();
        }

        return upAxis;
    }

    return this.startUpAxis;
}


// Applies bankingFunction on startUpAxis, assuming endUpAxis is set by now
CircularSegment.prototype.getUpAxis = function(distCovered)
{
    var upAxis = this.startUpAxis;
    if (this.bankingFunction) {
        // Interpolate the upAxis from the startUpAxis based on fraction of dist covered in segment
        var frac = distCovered/this.segmentLength;
        upAxis = BABYLON.Vector3.Lerp(upAxis, this.endUpAxis, frac);
    }

    //vecprint(upAxis);

    return upAxis;
}


CircularSegment.prototype.generatePointList = function(step)
{
    // This is normalized already
    var unitvecCurrentDir = this.unitvecStartRadius.clone();

    var m = new BABYLON.Matrix();
    var q = BABYLON.Quaternion.RotationAxis(this.normal, step);
    q.toRotationMatrix(m); 

    var theta;
    var vecCurrentPos;
    for (theta = 0; theta < this.angle; theta += step ) { 
        // Note unitvecCurrentDir IS NOT scaled in place, its still a unit vector
        vecCurrentPos = unitvecCurrentDir.scale(this.radius);
        vecCurrentPos.addInPlace(this.center);
        this.pointList.push( vecCurrentPos );
        //console.debug("theta:" + theta + ", angle:" + this.angle + ", vecCurrentPos: (" + vecCurrentPos.x + "," + vecCurrentPos.y + "," + vecCurrentPos.z + ")");

        // Rotate unitvecCurrentDir by step each iteration
        unitvecCurrentDir = BABYLON.Vector3.TransformCoordinates(unitvecCurrentDir, m);
    }


    // The last point must be on ending vector at this.angle wrt this.unitvecStartRadius
    this.pointList.push(this.endPoint);
    this.pointList.push(this.center);
    this.pointList.push(this.startPoint);

    this.normalPointList.push(this.center);
    this.normalPointList.push(this.center.add(this.normal));

    // The loco can travel inside or on a curve apart from the edge of plate situation
    // The upAxis for ascending/descending curves change continuously. We need to detect such curves 
    // using bConvex = true/false and generate the normals. Currently upAxis generation for 
    // circular segments which use bConvex, is disabled.

    /*this.upAxisPointList.push(this.startPoint);
    this.upAxisPointList.push(this.startPoint.add(this.startUpAxis));*/

    //console.debug("vecCurrentPos: (" + vecCurrentPos.x + "," + vecCurrentPos.y + "," + vecCurrentPos.z + ")");
}


// See http://stackoverflow.com/questions/12219802/a-javascript-function-that-returns-the-x-y-points-of-intersection-between-two-ci
CircularSegment.prototype.intersectCoPlanarCircles = function(x0, y0, r0, x1, y1, r1) 
{
    var a, dx, dy, d, h, rx, ry;
    var x2, y2;

    /* dx and dy are the vertical and horizontal distances between
     * the circle centers.
     */
    dx = x1 - x0;
    dy = y1 - y0;

    /* Determine the straight-line distance between the centers. */
    d = Math.sqrt((dy*dy) + (dx*dx));

    /* Check for solvability. */
    if (d > (r0 + r1)) {
        /* no solution. circles do not intersect. */
        return false;
    }
    if (d < Math.abs(r0 - r1)) {
        /* no solution. one circle is contained in the other */
        return false;
    }

    /* 'point 2' is the point where the line through the circle
     * intersection points crosses the line between the circle
     * centers.  
     */

    /* Determine the distance from point 0 to point 2. */
    a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

    /* Determine the coordinates of point 2. */
    x2 = x0 + (dx * a/d);
    y2 = y0 + (dy * a/d);

    /* Determine the distance from point 2 to either of the
     * intersection points.
     */
    h = Math.sqrt((r0*r0) - (a*a));

    /* Now determine the offsets of the intersection points from
     * point 2.
     */
    rx = -dy * (h/d);
    ry = dx * (h/d);

    /* Determine the absolute intersection points. */
    var xi = x2 + rx;
    var xi_prime = x2 - rx;
    var yi = y2 + ry;
    var yi_prime = y2 - ry;

    return [xi, xi_prime, yi, yi_prime];
}

// Get intersection in 2D & project to 3D
CircularSegment.prototype.getIntersectionWithSphere = function(sphCenter, sphRadius)
{
    var vecSphereToCircle = this.center.subtract(sphCenter);
    var d = BABYLON.Vector3.Dot(this.normal, vecSphereToCircle);  // d = dot(n, c_c - c_s)
    if (Math.abs(d) > sphRadius) {
        return {
            bFound: false
        };
    }

    // There is an intersection, find the center of the circle formed by the plane cutting the sphere - cp
    var cp = sphCenter.add(this.normal.scale(d));   // c_p = c_s + d*n

    // Is there just one intersection ?
    if (Math.abs(d-sphRadius) < FLOAT.ZERO) {
         // cp is the only intersection
        return {
            bFound: true,
            point: cp
        };
    }

    var rp = Math.sqrt( (sphRadius*sphRadius) - (d*d));
    var vecCircleToCP = cp.subtract(this.center);
    var d = vecCircleToCP.length();

    var pnts = this.intersectCoPlanarCircles(0, 0, this.radius, d,0, rp);
    var x1 = pnts[0], x2 = pnts[1], y1 = pnts[2], y2 = pnts[3];

    var unitvecCircleToCP = vecCircleToCP.normalize();

    // P1
    var theta = Math.atan(y1/x1);
    var q = BABYLON.Quaternion.RotationAxis(this.normal, theta);
    var m = new BABYLON.Matrix();
    q.toRotationMatrix(m); 

    var unitvecP = BABYLON.Vector3.TransformCoordinates(unitvecCircleToCP, m);
    var radvecP = unitvecP.scale(this.radius);
    
    var p = this.center.add(radvecP);

    var unitVecCircleToP = radvecP.normalize();
    var angleWithStartRadius = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecStartRadius, unitVecCircleToP)));
    //console.debug("angleWithStartRadius:" + angleWithStartRadius);
    if (angleWithStartRadius < this.angle) {
        var crossprod = BABYLON.Vector3.Cross(this.unitvecStartRadius, unitVecCircleToP);
        var det = BABYLON.Vector3.Dot(this.normal, crossprod);
        //console.log("det:" + det);
        if (det > 0) {
            return {
                bFound: true,
                point: p
            };
        }
    }

    // P2 - try to use reflection here to get 2nd point
    q = BABYLON.Quaternion.RotationAxis(this.normal, -theta);
    q.toRotationMatrix(m);
    unitvecP = BABYLON.Vector3.TransformCoordinates(unitvecCircleToCP, m);
    radvecP = unitvecP.scale(this.radius);
    p = this.center.add(radvecP);

    unitVecCircleToP = radvecP.normalize();
    angleWithStartRadius = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecStartRadius, unitVecCircleToP)));
    //console.debug("angleWithStartRadius:" + angleWithStartRadius);
    if (angleWithStartRadius < this.angle) {
        return {
            bFound: true,
            point: p
        };
    }

    // If both points were outside circular segment bounds then we have a problem
    // This should never happen as we always get 2 valid points in 2D & after projecting
    // to 3D one point MUST be within segment
    return {
        bFound: false
    };
}

// See http://gamedev.stackexchange.com/questions/75756/sphere-sphere-intersection-and-circle-sphere-intersection
CircularSegment.prototype.getIntersectionWithSphere2 = function(sphCenter, sphRadius)
{
    //console.debug("Checking for circle with endPoint:(" + this.endPoint.x + "," + this.endPoint.y + "," + this.endPoint.z + "), angle:" + this.angle);
    //console.debug("sphCenter:(" + sphCenter.x + "," + sphCenter.y + "," + sphCenter.z + "), sphRadius:" + sphRadius);

    // If plane of circle further away than sphere radius, no intersection
    var vecSphereToCircle = this.center.subtract(sphCenter);
    var d = BABYLON.Vector3.Dot(this.normal, vecSphereToCircle);  // d = dot(n, c_c - c_s)
    if (Math.abs(d) > sphRadius) {
        return {
            bFound: false
        };
    }

    // There is an intersection, find the center of the circle formed by the plane cutting the sphere - cp
    var cp = sphCenter.add(this.normal.scale(d));   // c_p = c_s + d*n

    // Is there just one intersection ?
    if (Math.abs(d-sphRadius) < FLOAT.ZERO) {
         // cp is the only intersection
        return {
            bFound: true,
            point: cp
        };
    }

    var rp = Math.sqrt( (sphRadius*sphRadius) - (d*d));

    // Find the tangent between the intersection circle in this plane & this circle
    var vecCircleToCP = cp.subtract(this.center);
    var t = BABYLON.Vector3.Cross(vecCircleToCP, this.normal);
    t.normalize();

    var d2 = vecCircleToCP.lengthSquared();
    var h = 1/2 + (this.radius*this.radius - rp * rp)/d2;    // h = 1/2 + (r_1 * r_1 - r_2 * r_2)/(d*d)
    var ci = this.center.add(vecCircleToCP.scale(h));        // c_i = c_1 + h * (c_2 - c_1)
    var temp = this.radius*this.radius - h*h*d2
    if (temp < 0) {
         return {
            bFound: false
        };
    }
    var ri = Math.sqrt(temp);    // r_i = sqrt(r_1*r_1 - h*h*d*d)

    // Return first intersection point among p0 & p1

    var unitvecFrontPointRadius = vecSphereToCircle.negate().normalize(); // -vecSphereToCircle is frontPointRadius
    var angleFrontPointWithStartRadius = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecStartRadius, unitvecFrontPointRadius)));
    var maxAngleSum = this.angle + 0.01;

    // Is p0 making lesser angle with start radius & frontPointRadius than the angle between start radius & frontPointRadius?
    var point = ci.subtract(t.scale(ri));
    var vecCircleToPoint = point.subtract(this.center).normalize();
    var angleWithStartRadius = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecStartRadius, vecCircleToPoint)));
    //console.debug("angleWithStartRadius:" + angleWithStartRadius);
    if (angleWithStartRadius > this.angle &&
          angleWithStartRadius < maxAngleSum && 
            angleWithStartRadius < angleFrontPointWithStartRadius) {
        return {
            bFound: true,
            point: point
        };
    }
    var angleWithEndRadius   = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecEndRadius, vecCircleToPoint)));
    var sum = angleWithStartRadius + angleWithEndRadius;
    /*console.debug("angleWithEndRadius:" + angleWithEndRadius +
                  " sum:" + sum +
                  " point :(" + point.x + "," + point.y + "," + point.z + ")");*/
    if (sum < maxAngleSum &&
          angleWithStartRadius < angleFrontPointWithStartRadius) {
        return {
            bFound: true,
            point: point
        };
    }

    // No its not so continue to next point p1 & repeat

    point = ci.add(t.scale(ri));
    vecCircleToPoint = point.subtract(this.center).normalize();
    var angleWithStartRadius = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecStartRadius, vecCircleToPoint)));
    //console.debug("angleWithStartRadius:" + angleWithStartRadius);

    var angleWithEndRadius   = Math.abs(Math.acos(BABYLON.Vector3.Dot(this.unitvecEndRadius, vecCircleToPoint)));
    if (angleWithStartRadius > this.angle &&
          angleWithStartRadius < maxAngleSum &&
            angleWithStartRadius < angleFrontPointWithStartRadius) {
        return {
            bFound: true,
            point: point
        };
    }
    
    var sum = angleWithStartRadius + angleWithEndRadius;
    /*console.debug("angleWithEndRadius:" + angleWithEndRadius +
                  " sum:" + sum +
                  " point :(" + point.x + "," + point.y + "," + point.z + ")");*/
    if (sum < maxAngleSum) {
         if (angleWithStartRadius < angleFrontPointWithStartRadius) {
            return {
                bFound: true,
                point: point
            };
        }
    }

    //console.debug("Returning false");

    // No its not so there is no intersection
    return {
            bFound: false
    };
}

// Get distance from startingPoint to pointOnLine - CHECK THIS
// http://math.stackexchange.com/questions/727286/calculate-arc-length-knowing-its-subtended-chord-and-circumference-diameter
CircularSegment.prototype.getDistanceFromPointOnSegment = function(pointOnSegment)
{
    var chordLength = BABYLON.Vector3.Distance(this.startPoint, pointOnSegment);
    var diameter = 2 * this.radius;
    var dist = diameter * Math.asin((chordLength/diameter));
    if (dist > this.segmentLength) {
        return -1;
    }

    return dist;
}

// Get point
CircularSegment.prototype.getPointFromDistanceOnSegment = function(distOnSegment)
{
    if (distOnSegment > this.segmentLength) {
        // The distance is too large to be accomodated in this segment
        // Return the extra distance left & a null point
        var diff = distOnSegment - this.segmentLength;
        diff = Math.round(diff * FLOAT.MAX_DP_MULTPLR) / FLOAT.MAX_DP_MULTPLR;
        return {
            distLeft: diff
        };
    }

    // The distance can be accomodated in this segment
    var m = new BABYLON.Matrix();
    var theta = distOnSegment/this.radius;
    var q = BABYLON.Quaternion.RotationAxis(this.normal, theta);
    q.toRotationMatrix(m);
    var unitvecCurrentDir = BABYLON.Vector3.TransformCoordinates(this.unitvecStartRadius, m);
    unitvecCurrentDir.scaleInPlace(this.radius);
    unitvecCurrentDir.addInPlace(this.center);

    //console.debug("(" + pointOnSegment.x + "," + pointOnSegment.y + "," + pointOnSegment.z + ")");

    return {
        distLeft: 0,
        pointOnSegment: unitvecCurrentDir
    };
}

// Get new point given distance on segment
CircularSegment.prototype.interpolatePoint = function(point, deltaOnSegment)
{
    var m = new BABYLON.Matrix();
    var theta = deltaOnSegment/this.radius;
    var q = BABYLON.Quaternion.RotationAxis(this.normal, theta);
    q.toRotationMatrix(m);
 
    var unitvecBackPointRadius = point.subtract(this.center).normalize();
    var newPoint = BABYLON.Vector3.TransformCoordinates(unitvecBackPointRadius, m);
    newPoint.scaleInPlace(this.radius);
    newPoint.addInPlace(this.center);

    point.x = newPoint.x;
    point.y = newPoint.y;
    point.z = newPoint.z;
}


// Check if a chord can be accomodated in this segment, given the distance covered
CircularSegment.prototype.isBackPointWithinSegment = function(distOnSegment, chordLength)
{
    // Find arc length subtended by chord
    var halfChord = chordLength/2;
    var angleSubtended = 2*Math.asin(halfChord/this.radius);
    var arcLengthForChord = this.radius*angleSubtended;

    if (distOnSegment > arcLengthForChord) {
        var pointInfo = this.getPointFromDistanceOnSegment(distOnSegment - arcLengthForChord);
        if (pointInfo.distLeft == 0) {
            return {
                bCanBeAccommodated: true,
                point: pointInfo.pointOnSegment
            };
        }
    }

    return {
        bCanBeAccommodated: false
    };
}

CircularSegment.prototype.draw = function(scene)
{
    BABYLON.Mesh.CreateLines("circle", this.pointList, scene);
     
    // For debugging
    /*for (i = 0; i < this.pointList.length; ++i) { 
        var sph = BABYLON.Mesh.CreateSphere("sphere", 10.0, 0.5, scene);
        sph.position = this.pointList[i];
        var yellowMaterial = new BABYLON.StandardMaterial("sphTexture", scene);
        yellowMaterial.diffuseColor = new BABYLON.Color3(1.0, 1.0, 0.0);
        sph.material = yellowMaterial;
    }*/

    this.sphSP = BABYLON.Mesh.CreateSphere("sphere", 10.0, 0.5, scene);
    this.sphSP.position = this.startPoint; // Using a vector
    this.sphEP = BABYLON.Mesh.CreateSphere("sphere", 10.0, 0.5, scene);
    this.sphEP.position = this.endPoint; // Using a vector

    // Meshes exist inside Babylon, we do not need to maintain the reference to keep the mesh 'alive'
    //BABYLON.Mesh.CreateLines("upAxisLines", this.upAxisPointList, scene);

    // Draw this only if different from upAxis?
    BABYLON.Mesh.CreateLines("normalLines", this.normalPointList, scene);
}


