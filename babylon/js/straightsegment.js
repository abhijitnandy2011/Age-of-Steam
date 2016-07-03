/**
 * Straight track segment
 */
function StraightSegment(json)
{
    if (!this.fromJSON(json)) {
        return;
    }

    // List of points to draw this segment
    this.pointList = [];
    this.pointList.push(this.startPoint);
    this.pointList.push(this.endPoint);

    // There is no separate normal for lines. The upAxis is the normal.
    this.upAxisPointList = [];
    this.upAxisPointList.push(this.startPoint);
    this.upAxisPointList.push(this.startPoint.add(this.startUpAxis));
}

// This is not a member - its a factory function to produce the object
StraightSegment.prototype.fromJSON = function(json)
{
    // Validation
    if (json.t != SEGMENTTYPE.STRAIGHT) {
        console.error("StraightSegment.fromJSON: Straight segment type should be " + SEGMENTTYPE.STRAIGHT);
        return false;
    }
    if (json.sua == null) {
        console.error("startUpAxis needs to be always specified.");
        return false;
    }

    this.id = json.id;
    this.segmentType = SEGMENTTYPE.STRAIGHT;

    this.startPoint = BABYLON.Vector3.FromArray(json.s, 0),
    this.direction = BABYLON.Vector3.FromArray(json.d, 0),
    this.startUpAxis = BABYLON.Vector3.FromArray(json.sua, 0),
    this.segmentLength = json.l

    // This field is optional - we add the key if it was passed
    if (json.eua) {
        this.endUpAxis =  BABYLON.Vector3.FromArray(json.eua, 0);
    }
    else {
        // No variation in upAxis throughout segment
        this.endUpAxis = this.startUpAxis;
    }

    // Calculated stuff
    this.endPoint = this.startPoint.add(this.direction.scale(this.segmentLength));

    return true;
}

StraightSegment.prototype.toJSON = function()
{
    var json = {};

    json.id = this.id;
    json.t = this.segmentType;
    json.s = this.startPoint.asArray();
    json.d = this.direction.asArray();
    json.sua = this.startUpAxis.asArray();
    json.l = this.segmentLength;

    return json;
}

StraightSegment.prototype.getUpAxis = function(distCovered)
{
    // TODO Use banking function if specified
    return this.startUpAxis;
}


// For the 3D case - not working yet. See:
// http://stackoverflow.com/questions/5883169/intersection-between-a-line-and-a-sphere
StraightSegment.prototype.getIntersectionWithSphereWIP = function(center, radius)
{
    var x0 = this.startPoint.x;
    var y0 = this.startPoint.y;
    var z0 = this.startPoint.z;

    var x1 = this.endPoint.x;
    var y1 = this.endPoint.y;
    var z1 = this.endPoint.z;

    var xc = center.x;
    var yc = center.y;
    var zc = center.z;

    var a = (x0-xc)^2 + (y0-yc)^2 + (z0-zc)^2 - radius^2;
    var c = (x0-x1)^2 + (y0-y1)^2 + (z0-z1)^2;
    var b = (x1-xc)^2 + (y1-yc)^2 + (z1-zc)^2 - a - c - radius^2;
    

    det = b^2 - 4*a*c;
    if (det <= 0) {
        return {
            bFound: false
        };
    }

    // Calulate t for + case
    t = (-b + Math.sqrt(det))/(2*a);
    if (t >=0 && t <=1) {
        // Calculate point
        return {
            bFound: true,
            point: this.startPoint.add(this.direction.scale(this.segmentLength*t))
        };
   }

   // Calulate t for - case
    t = (-b - Math.sqrt(det))/(2*a);
    if (t >=0 && t <=1) {
        // Calculate point
        return {
            bFound: true,
            point: this.startPoint.add(this.direction.scale(this.segmentLength*t))
        };
   }

    // There has to exist an intersection always.
    console.error("[ERROR] While getting line sphere intersection.");
}

// From http://www.codeproject.com/Articles/19799/Simple-Ray-Tracing-in-C-Part-II-Triangles-Intersec
StraightSegment.prototype.getIntersectionWithSphere = function(center, radius)
{


    var cx = center.x;
    var cy = center.y;
    var cz = center.z;

    var px = this.startPoint.x;
    var py = this.startPoint.y;
    var pz = this.startPoint.z;

    var vx = this.endPoint.x - px;
    var vy = this.endPoint.y - py;
    var vz = this.endPoint.z - pz;

    var A = vx * vx + vy * vy + vz * vz;
    var B = 2.0 * (px * vx + py * vy + pz * vz - vx * cx - vy * cy - vz * cz);
    var C = px * px - 2 * px * cx + cx * cx + py * py - 2 * py * cy + cy * cy +
               pz * pz - 2 * pz * cz + cz * cz - radius * radius;

    // discriminant
    var D = B * B - 4 * A * C;
    if (D <= 0) {
        return {
            bFound: false
        };
    }

    // Calc t for the + case
    var t = ( -B + Math.sqrt( D ) ) / ( 2.0 * A );
    if (t >=0 && t <=1) {
        // We still need to check if this t gives a point closer to startPoint than 
        // the location of center along the line
        var tc = BABYLON.Vector3.Distance(center, this.startPoint)/this.segmentLength;
        if (t < tc) {
            // Calculate point, prevent floating point errors
            var factor = this.segmentLength*t;
            factor = Math.round(factor * FLOAT.MAX_DP_MULTPLR) / FLOAT.MAX_DP_MULTPLR;
            return {
                bFound: true,
                point: this.startPoint.add(this.direction.scale(factor))
            };
        }
   }

   // Calulate t for - case
    t = ( -B - Math.sqrt( D ) ) / ( 2.0 * A );
    if (t >=0 && t <=1) {
        // We still need to check if this t gives a point closer to startPoint than 
        // the location of center along the line
        var tc = BABYLON.Vector3.Distance(center, this.startPoint)/this.segmentLength;
        if (t < tc) {
            // Calculate point, prevent floating point errors
            var factor = this.segmentLength*t;
            factor = Math.round(factor * FLOAT.MAX_DP_MULTPLR) / FLOAT.MAX_DP_MULTPLR;
            return {
                bFound: true,
                point: this.startPoint.add(this.direction.scale(factor))
            };
        }
   }

    // There may not be an intersection - must goto next segment.
    // This leaves open the possibility of an algo error going unnoticed.
    return {
        bFound: false
    };
}

// Get distance from startingPoint to pointOnLine
StraightSegment.prototype.getDistanceFromPointOnSegment = function(pointOnSegment)
{
    var dist = BABYLON.Vector3.Distance(this.startPoint, pointOnSegment);
    if (dist > this.length) {
        return -1;
    }

    return dist;
}

// Get point
StraightSegment.prototype.getPointFromDistanceOnSegment = function(distOnSegment)
{
    if (distOnSegment > this.segmentLength) {
        // The total distance too large to be accomodated in this segment
        var diff = distOnSegment - this.segmentLength;
        diff = Math.round(diff * FLOAT.MAX_DP_MULTPLR) / FLOAT.MAX_DP_MULTPLR;
        return {
            distLeft: diff
        };
    }

    // The distance can be accomodated in this segment
    var pointOnSegment = this.startPoint.add(this.direction.scale(distOnSegment));

   /* console.debug("(" + pointOnSegment.x + "," + pointOnSegment.y + "," + pointOnSegment.z + ")" + 
    " distOnSegment:" + distOnSegment);*/
    
    return {
        distLeft: 0,
        pointOnSegment: pointOnSegment
    };
}

// Get new point given distance on segment
StraightSegment.prototype.interpolatePoint = function(point, deltaOnSegment)
{
    var newPoint = point.add(this.direction.scale(deltaOnSegment));

    point.x = newPoint.x;
    point.y = newPoint.y;
    point.z = newPoint.z;
}


// Check if a length can be accomodated in this segment
StraightSegment.prototype.isBackPointWithinSegment = function(distOnSegment, lengthToChk)
{
    if (distOnSegment > lengthToChk) {
        var pointInfo = this.getPointFromDistanceOnSegment(distOnSegment - lengthToChk);
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

// draw this segment including sleepers
StraightSegment.prototype.draw = function(scene)
{
    /*this.segmentMesh[seg] = */ BABYLON.Mesh.CreateLines("lines", this.pointList, scene);
    BABYLON.Mesh.CreateLines("upAxisLines", this.upAxisPointList, scene);
}
