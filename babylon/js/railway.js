var USE_RAILWAY_JSON_TRACKS = true

/**
 * A Railway consists of multiple trains, multiple track segments, signals, platforms, personnel etc
 */
function Railway(json)
{
    /**
    The segments that are needed for trains currently active are referenced by members of this array.
    Each segment has an unique ID which is the key in this map. Segments required for building a track
    are referenced sequentially in an array in a RailTrack object.
    This map helps us lok up segments by ID
    Its used to share segments between tracks - Tracks refer to these segments & do not create a copy
    */
    this.mapSegments = {};

    // Map of RailTrack ID vs Segment IDs contained in the track
    this.mapTrackIDvsSegmentIDArray = {};

    // RailTracks are created on this map on start
    this.mapTrackIDvsTrackObj = {};
    
    // Trains are initially created here
    this.mapTrainIDvsTrainObj = {};

    // Init this object from the json map
    this.fromJSON(json);
    
    this.bInError = false;
    this.bFirstIterationOver = false;
    
    // look up the elements we want to affect
    var speedElement = document.getElementById("speed");
    var accelElement = document.getElementById("accel");
    var normalBrakeElement    = document.getElementById("normalBrake");
    var emergencyBrakeElement = document.getElementById("emergencyBrake");
    var alertElement = document.getElementById("alert");
     
    // Create text nodes to save some time for the browser.
    this.speedNode = document.createTextNode("0");
    this.accelNode = document.createTextNode("0");
    this.normalBrakeNode = document.createTextNode("OFF");
    this.emergencyBrakeNode = document.createTextNode("OFF");
    this.alertNode = document.createTextNode("");

    // Add those text nodes where they need to go
    speedElement.appendChild(this.speedNode);
    accelElement.appendChild(this.accelNode);
    normalBrakeElement.appendChild(this.normalBrakeNode);
    emergencyBrakeElement.appendChild(this.emergencyBrakeNode);
    alertElement.appendChild(this.alertNode);

}


// Returns a simple JSON object(map) of values built from the state of this object
// It can be used to recreate this object if passed to the ctor
Railway.prototype.toJSON = function()
{
    var json = {};

    json.name = this.name;
    json.focussedTrainID = this.focussedTrain.id;

    // Add segments, their platforms & signals
    json.segments = [];
    for (var id in this.mapSegments) {
        var segmentJSON = this.mapSegments[id].toJSON();
        json.segments.push(segmentJSON);
    }

    // Add tracks and their signals

    // Add trains

    return json;
}

// Initialize this object from the passed json obj
Railway.prototype.fromJSON = function(json)
{
    this.name = json.name;
    this.scene = json.scene;

    if (USE_RAILWAY_JSON_TRACKS) {
        // Create segments - NOTE: The segments must be held by the Railway not by the RailTrack
        // A RailTrack object uses the segments but does not own them - in fact the RailTrack 
        // sequences the segments. The Railway just holds a map of segments but has no sequencing info
        // But holding the segment map in the Railway & sharing the segments among tracks is more
        // accurate - a signal change in a segment will be conveyed to both train on 2 separate 
        // tracks but sharing the same segment - so the segments must be loaded by the railway,
        // RailTrack objects simply refer to the segment objects via a segments[] array
        for (idx = 0; idx < json.segments.length; ++idx ) {

            var segJSON = json.segments[idx];
            if (segJSON.t == SEGMENTTYPE.STRAIGHT) {
                // Call factory method in segment class to get the object
                var segObj = new StraightSegment(segJSON);
                if (segObj == null ) {
                    console.error("Railway.prototype.fromJSON: Straight segment could not be created");
                    return false;
                }
            }
            else if(segJSON.t == SEGMENTTYPE.CIRCLE) {
                var segObj = new CircularSegment(segJSON);
                if (segObj == null ) {
                    console.error("Railway.prototype.fromJSON: Circular segment could not be created");
                    return false;
                }
            }
            else {
                console.error("Railway.prototype.fromJSON: Incorrect segment type");
                return;
            }

            this.mapSegments[segJSON.id] = segObj;
        }
    }
    else {
        //crazyTrack(this.mapSegments);
        realChairTrack(this.mapSegments);
    }

    // Create tracks
    for (idx = 0; idx < json.tracks.length; ++idx ) {
        var track = json.tracks[idx];

        this.mapTrackIDvsSegmentIDArray[track.id] = track.segments;

        var trackObj = new RailTrack({
            id: track.id,
            version: 0.1,
            bLoop: track.loop
        });

        // Keep this track obj at the proper track id in tracks map
        this.mapTrackIDvsTrackObj[track.id] = trackObj;

        var segments = track.segments;
        for(sidx = 0; sidx < segments.length; ++sidx) {
            // Get the current seg id to look up in segments map
            var segId = segments[sidx];
            // Lookup & add the segment object at key segId
            trackObj.addSegmentAtEnd(this.mapSegments[segId]);
        }
    }

    // Create trains
    for (idx = 0; idx < json.trains.length; ++idx ) {
        var trainJSON = json.trains[idx];
        trainJSON.railway = this;
        trainJSON.trackID = trainJSON.trkID;
        trainJSON.track = this.mapTrackIDvsTrackObj[trainJSON.trackID];

        this.mapTrainIDvsTrainObj[trainJSON.id] = new Train(trainJSON)
    }

    // Currently focussed train
    this.focussedTrain = this.mapTrainIDvsTrainObj[json.focussedTrainID];
}

Railway.prototype.getTrackAtID = function(id)
{
    return this.mapTrackIDvsTrackObj[id];
}

Railway.prototype.alert = function(msg)
{
    this.alertNode.nodeValue = msg;
}

Railway.prototype.update = function(dt)
{
    console.log("------------update start-----------------");

    // Update tracks
    for (var id in this.mapTrackIDvsTrackObj) {
        this.mapTrackIDvsTrackObj[id].updateAndDraw(dt, this.scene);
    }

    // Update trains
    for (var id in this.mapTrainIDvsTrainObj) {        
        if (!this.mapTrainIDvsTrainObj[id].update(dt, this.scene)){
            // The train has run into an error - send false to deregister rendering func
            return false;
        }
    }

    this.bFirstIterationOver = true;

    return true;
}
