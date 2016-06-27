/**
 * Rail track management - a track is made of segments
 * Mainly geometric tracking is needed here. Works in Babylon's reference frame.
 */


//*******************************************************************************************************************************
/**
 * RailTrack - composed of sections
 * @param {map} options - track options
 * @constructor
 */
function RailTrack(options)
{
// Public:
    /**
    This check is an optimization. We do not allow the search for bp to continue till we have 
    looped whole line ! impossible in reality !! That would require loading the entire track.
    We make each segment long enough that its not possible for bs to be anywhere near fs unless its behind fp!
    The search continues till the segment difference reaches track.MAX_VEHICLE_SEGMENT_DIFF
    This is when searching for bp on a per coach basis. The last coach's bs will on segment >= 0. 
    We always ensure that. It will never happen that bs is on segment = -1 as bs will start from 0 for last
    coach. Direction reversal causes whole track to be reversed to keep these conditions intact.
    */
    this.MAX_VEHICLE_SEGMENT_DIFF = 2;  // If we reach this value we abort, a valid difference is 1

    /**
    The number of segments to keep active ahead of loco fs. This is also the number of segments
    we can search in the fwd direction when searching for fs after applying speed.
    */
    this.MAX_SEGMENT_INCREMENT = 1;


// Private:
    /**
    The *ACTIVE* track segments are in this array. Higher index of a segment means it will be 
    reached later. The entire train  must be always somewhere in the middle of this array
    The last coach's bp is on the 0th segment. The first on length-MAX_SEGMENT_INCREMENT
    As the fs of the loco approaches length we load the geometry of more segments
    overwriting the existing ones & moving the train backwards in the array. This reuse 
    ensures the size of this.segments[] never exceeds a hard limit.
    When train changes direction we reverse the ordering of the array as well as the startingPoint
    & endingPoint of each segment(there should be < 5 active segments - make them really long!!).
    We also ensure appropriate segments are read behind the train to reinforce the MAX_SEGMENT_INCREMENT. 
    In this sense the track always aligns with the train's fwd direction !!.
    this.segments[] always points forward. 
    */
    this.segments = [];

    /**
    We allow looping of the track for the Rainhill trials :)
    */
    this.bLoop = options.bLoop;

    /**
    Flag to skip unnecessary redraws
    */
    this.bNeedsDraw = true;

    this.segmentMesh = [];
}




// ---------------------------------------------------------------------------------------------------------------------------
/**
 * RailTrack
 */
RailTrack.prototype.addSegmentAtEnd = function(segment)
{
    this.segments.push(segment);
};


/**
 * RailTrack
 */
RailTrack.prototype.getSegment = function(index)
{
    return this.segments[index];
};


/**
 * Get next segment by going up or down wrt current segment
 */
RailTrack.prototype.getPreviousSegment = function(currentSegment)
{
    --currentSegment;
    if (currentSegment < 0) {
        if (this.bLoop) {
            return  this.segments.length -1 ;
        }
        return -1;
    }

    return currentSegment;
}



/**
 * Get next segment by going up or down wrt current segment
 */
RailTrack.prototype.getNextSegment = function(currentSegment)
{
    ++currentSegment;
    if (currentSegment == this.segments.length) {
        if (this.bLoop) {
            console.debug("Line has been looped back to 0");
            return  0 ;
        }
        return -1;
    }

    return currentSegment;
}


/**
 * Get next segment by going up or down wrt current segment
 * @param {Number} dt - time delta since last frame
 * @param {Babylon.scene} scene - the scene to draw in
 */
RailTrack.prototype.updateAndDraw = function(dt, scene)
{
    if (!this.bNeedsDraw) {
        return;
    }

    for (var seg = 0; seg < this.segments.length; ++seg) {
        this.segments[seg].draw(scene);
    }

    this.bNeedsDraw = false;
}

/**
 * Convert this track object to JSON
 * @return {String} JSON string
 */
RailTrack.prototype.toJSON = function()
{
    //console.debug(this.segments[0])
    var jsonString = "track = "
    
    for (var seg = 0; seg < this.segments.length; ++seg) {
        var currentSegment = this.segments[seg];
    
        var jsonSegment = JSON.stringify(currentSegment,
            [
                'segmentType','startPoint', 'x', 'y', 'z',
                'direction', 'startUpAxis', 'endUpAxis', 'segmentLength',
                'center', 'radius', 'angle', 'normal', 
                'bConvex',
                
            ],
            4);
       jsonString += jsonSegment
    }
    return jsonString;
}


/**
 * Parse this JSON to set this track object
 * @oaram {String} JSON string
 */
RailTrack.prototype.fromJSON = function(jsonObj)
{
    console.debug(jsonObj);
    //logit(json);

    for (var seg = 0; seg < jsonObj.length; ++seg) {

        var currentSeg;
        var segJSON = jsonObj[seg];
        switch (segJSON.segmentType) {
            case SEGMENTTYPE.STRAIGHT:
            {
                var sp  = segJSON.startPoint;
                var dir = segJSON.direction;
                var suA    = segJSON.startUpAxis;
                var euA    = segJSON.endUpAxis;

                // Line going straight down x axis
                currentSeg = new StraightSegment({
                    startPoint : new BABYLON.Vector3(sp.x, sp.y, sp.z),
                    direction  : new BABYLON.Vector3(dir.x, dir.y, dir.z),
                    startUpAxis : new BABYLON.Vector3(suA.x, suA.y, suA.z),
                    endUpAxis : new BABYLON.Vector3(euA.x, euA.y, euA.z),
                    segmentLength : segJSON.segmentLength
                });
                break;
            }

            case SEGMENTTYPE.CIRCLE:
            {
                var sp     = segJSON.startPoint;
                var center = segJSON.center;
                var radius = segJSON.radius;
                var angle  = segJSON.angle;
                var normal = segJSON.normal;
                var suA    = segJSON.startUpAxis;
                var euA    = segJSON.endUpAxis;

                if (segJSON.bConvex) {
                    currentSeg = new CircularSegment({
                        center : new BABYLON.Vector3(center.x, center.y, center.z),
                        radius : radius,
                        angle : angle,
                        startPoint : new BABYLON.Vector3(sp.x, sp.y, sp.z),
                        normal : new BABYLON.Vector3(normal.x, normal.y, normal.z),
                        startUpAxis : new BABYLON.Vector3(suA.x, suA.y, suA.z),
                        endUpAxis : new BABYLON.Vector3(euA.x, euA.y, euA.z),
                        bConvex : segJSON.bConvex
                    });
                }
                break;
            }

            default:
                console.debug("Error in segment type while json parsing");
        }

        this.addSegmentAtEnd(currentSeg)
    }

}


