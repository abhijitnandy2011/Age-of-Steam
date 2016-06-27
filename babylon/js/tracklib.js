// Railway LIbrary

function rainHillTrialsRailway()
{
    var trackLen = 100;
    var radius = 50;

    var railwayObj = {
        name: 'Liverpool and Manchester Railway',
        segments: [],
        tracks: {},
        trains: {},
        focussedTrainID: 1
    };

    railwayObj.segments = [
        {
            id: 1,
            t: 1,           // type
            s: [-1000, 0, 0],  // startPoint
            d: [1, 0, 0],  // dir
            sua: [0, 1, 0], // startUpAxis
            l: 1000 + 100    // length
        },

        {
            id: 2,
            t : 2,
            c : [trackLen, radius, 0],  // center
            r : radius,                 // radius
            a : Math.PI / 6,            // angle
            s : [trackLen, 0, 0],
            n : [0, 0, +1],             // normal
            sua : [0, 1, 0],
            cvx : false   // bConvex - nil for plate
        },

        {
            id: 3,
            t : 2,
            c : [125, 6.6987305879592896, -50],  // center
            r : radius,                 // radius
            a : Math.PI,            // angle
            s : [125, 6.6987305879592896, 0],
            n : [-0.5, 0.8660253882408142, 0],             // normal
            sua : [-0.5, 0.8660253882408142, 0],  // startUpAxis
            eua : [-0.5, 0.8660253882408142, 0],  // endUpAxis
            cvx : false   // bConvex - nil for plate
        },

        {
            id: 4,
            t : 2,
            c : [150, -36.60253882408142, -99.99999701976776],  // center
            r : radius,                 // radius
            a : Math.PI/4,            // angle
            s : [125, 6.698730587959292, -99.99999701976776],
            n : [-1.0605752472130298e-16, -6.123234262925839e-17, 0.9999999403953552],             // normal
            sua : [-0.5, 0.8660253882408142, 0],  // startUpAxis
            eua : [0, 1, 0],  // endUpAxis
            cvx : false,   // bConvex - nil for plate
        }
    ];

    railwayObj.tracks = [
        {
            id: 1,
            loop: false,  // Be sure to change this to true if looping & change it back to false if not looping
            segments: [ 1, 2, 3, 4]
        }
    ]

    railwayObj.trains = [
        {
            id: 1,
            name: "Rocket",
            trkID: 1,
            linkLen: 1,
            dir: 1,
            fSpeed: 0.0,
            fAccel: 0.0,
            carLen: 20,
            carWidth: 4,
            carHt: 1.5,
            vehicles:[
                {t:1, id:1, fp:[50, 0, 0], frontSeg:0}, // type(1-1000 are propulsion contributors), id
                {t:1001, id:2, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:3, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:4, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:5, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:6, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:7, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:8, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:9, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:10, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:11, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:12, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:13, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:14, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:15, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:16, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:17, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:18, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:19, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:20, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:21, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:22, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:23, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:24, fp:[50, 0, 0], frontSeg:0},
                {t:1001, id:25, fp:[50, 0, 0], frontSeg:0},
            ]
        }
    ]

    return railwayObj;
}





// Track library
function rainHillTrack(mapSegments)
{
    var trackLen = 100;
    var radius = 50;

    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: false
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(-1000, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : 1000+100
    });

    // Y axis is up, x forward, z to the left, left handed system

    // upward curve
   var seg2 = new CircularSegment({
         center : new BABYLON.Vector3(trackLen, radius, 0),
         radius : radius,
         angle : Math.PI / 6,
         startPoint : new BABYLON.Vector3(trackLen, 0, 0),
         normal : new BABYLON.Vector3(0, 0, +1),
         startUpAxis : seg1.endUpAxis,
         bConvex : false   // No need of upAxis as that changes continuously
    });

    // 90 degree turn to plate
    var center = seg2.endPoint.clone();
    center.addInPlace(seg2.normal.scale(-radius));
    var normal = seg2.unitvecEndRadius.negate();
    //rmal = normal.negate();
    var seg3 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg2.endPoint,
         normal : normal,
         startUpAxis: normal.clone(),
         endUpAxis : normal, //new BABYLON.Vector3(0, 1, 0),
         bankingFunction : true
    });

    center = seg3.endPoint.clone();
    center.addInPlace(seg3.normal.scale(-radius));
    var tangent = BABYLON.Vector3.Cross(seg3.normal, seg3.unitvecEndRadius);
    var seg4 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 4,
        startPoint : seg3.endPoint,
        normal: seg3.unitvecEndRadius.negate(),
        startUpAxis : seg3.normal,
        endUpAxis: new BABYLON.Vector3(0, 1, 0),
        bConvex : true
    });
    
    center = seg4.endPoint.clone();
    center.addInPlace(seg4.unitvecEndRadius.scale(radius));
    normal = seg4.normal.negate();
    var seg5 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg4.endPoint,
        normal: normal,
        startUpAxis : seg4.unitvecEndRadius,
        endUpAxis : new BABYLON.Vector3(0, 1, 0),
        bConvex: false,
        bankingFunction : true
    });

    // 90 degree turn to plate
    var center = seg5.endPoint.clone();
    center.addInPlace(seg5.normal.scale(-radius));
    var normal = seg5.unitvecEndRadius.negate();
    //rmal = normal.negate();
    var seg6 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2 + Math.PI/4,
         startPoint : seg5.endPoint,
         normal : normal,
         startUpAxis: new BABYLON.Vector3(0, 1, 0),
    });
    
    center = seg6.endPoint.clone();
    center.addInPlace(seg6.unitvecEndRadius.scale(radius));
    normal = seg6.normal.negate();
    var seg7 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 3 + Math.PI/18,
        startPoint : seg6.endPoint,
        normal: normal,
        startUpAxis : new BABYLON.Vector3(0, 1, 0),
        endUpAxis : new BABYLON.Vector3(0, 1, 0),
        bConvex: false,
    });
    
        // Line going straight down x axis
    var seg8 = new StraightSegment({
        startPoint : seg7.endPoint,
        direction  : BABYLON.Vector3.Cross(seg7.normal, seg7.unitvecEndRadius).normalize(),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    mapSegments[1] = seg1;
    mapSegments[2] = seg2;
    mapSegments[3] = seg3;
    mapSegments[4] = seg4;
    mapSegments[5] = seg5;
    mapSegments[6] = seg6;
    mapSegments[7] = seg7;
    mapSegments[8] = seg8;

}




function crazyTrack(mapSegments)
{
    var trackLen = 100;
    var radius = 50;

    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: false
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(-1000, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : 1000+100
    });

    // Y axis is up, x forward, z to the left, left handed system

    // upward curve
   var seg2 = new CircularSegment({
         center : new BABYLON.Vector3(trackLen, radius, 0),
         radius : radius,
         angle : Math.PI / 6,
         startPoint : new BABYLON.Vector3(trackLen, 0, 0),
         normal : new BABYLON.Vector3(0, 0, +1),
         startUpAxis : seg1.endUpAxis,
         bConvex : false   // No need of upAxis as that changes continuously
    });

    // 90 degree turn to plate
    var center = seg2.endPoint.clone();
    center.addInPlace(seg2.normal.scale(-radius));
    var normal = seg2.unitvecEndRadius.negate();
    //rmal = normal.negate();
    var seg3 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg2.endPoint,
         normal : normal,
         startUpAxis: normal.clone(),
         endUpAxis : normal, //new BABYLON.Vector3(0, 1, 0),
         bankingFunction : true
    });

    center = seg3.endPoint.clone();
    center.addInPlace(seg3.normal.scale(-radius));
    var tangent = BABYLON.Vector3.Cross(seg3.normal, seg3.unitvecEndRadius);
    var seg4 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 4,
        startPoint : seg3.endPoint,
        normal: seg3.unitvecEndRadius.negate(),
        startUpAxis : seg3.normal,
        endUpAxis: new BABYLON.Vector3(0, 1, 0),
        bConvex : true
    });
    
    center = seg4.endPoint.clone();
    center.addInPlace(seg4.unitvecEndRadius.scale(radius));
    normal = seg4.normal.negate();
    var seg5 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg4.endPoint,
        normal: normal,
        startUpAxis : seg4.unitvecEndRadius,
        endUpAxis : new BABYLON.Vector3(0, 1, 0),
        bConvex: false,
        bankingFunction : true
    });

    // 90 degree turn to plate
    var center = seg5.endPoint.clone();
    center.addInPlace(seg5.normal.scale(-radius));
    var normal = seg5.unitvecEndRadius.negate();
    //rmal = normal.negate();
    var seg6 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2 + Math.PI/4,
         startPoint : seg5.endPoint,
         normal : normal,
         startUpAxis: new BABYLON.Vector3(0, 1, 0),
    });
    
    center = seg6.endPoint.clone();
    center.addInPlace(seg6.unitvecEndRadius.scale(radius));
    normal = seg6.normal.negate();
    var seg7 = new CircularSegment({
        center : center,
        radius : radius,
        angle : Math.PI / 3 + Math.PI/18,
        startPoint : seg6.endPoint,
        normal: normal,
        startUpAxis : new BABYLON.Vector3(0, 1, 0),
        endUpAxis : new BABYLON.Vector3(0, 1, 0),
        bConvex: false,
    });
    
        // Line going straight down x axis
    var seg8 = new StraightSegment({
        startPoint : seg7.endPoint,
        direction  : BABYLON.Vector3.Cross(seg7.normal, seg7.unitvecEndRadius).normalize(),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    mapSegments[1] = seg1;
    mapSegments[2] = seg2;
    mapSegments[3] = seg3;
    mapSegments[4] = seg4;
    mapSegments[5] = seg5;
    mapSegments[6] = seg6;
    mapSegments[7] = seg7;
    mapSegments[8] = seg8;

}


function realChairTrack(mapSegments)
{
    var trackLen = 50;
    var radius = 50;
    
    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: true
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    // Y axis is up, x forward, z to the left, left handed system

    // upward curve
   var seg2 = new CircularSegment({
         center : new BABYLON.Vector3(trackLen, radius, 0),
         radius : radius,
         angle : Math.PI / 2,
         startPoint : new BABYLON.Vector3(trackLen, 0, 0),
         normal : new BABYLON.Vector3(0, 0, +1),
         startUpAxis: seg1.endUpAxis,
         bConvex : false  // No need of upAxis as that changes continuously
    });
    
    // Line going straight up y axis
    var seg3 = new StraightSegment({
        startPoint : seg2.endPoint,
        direction  : new BABYLON.Vector3(0, 1, 0),
        startUpAxis: new BABYLON.Vector3(-1, 0, 0),
        segmentLength : trackLen
    });

    // 90 degree turn to plate
    var center = seg3.endPoint.clone();
    center.addInPlace(seg2.normal.scale(-radius));
    var normal = seg2.unitvecEndRadius.clone();
    normal = normal.negate();
    var upAxis = normal.clone();
    var seg4_1 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2,
         startPoint : seg3.endPoint,
         normal : normal,
         startUpAxis: upAxis
    });
    
    var seg4_2 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2,
         startPoint : seg4_1.endPoint,
         normal : normal,
         startUpAxis: upAxis
    });
    
    
    // Line going straight down y axis
    var seg5 = new StraightSegment({
        startPoint : seg4_2.endPoint,
        direction  : new BABYLON.Vector3(0, -1, 0),
        startUpAxis: new BABYLON.Vector3(-1, 0, 0),
        segmentLength : trackLen
    });


    var center = seg2.center.clone();
    center.z -= radius*2;
    var seg6 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI / 2,
         startPoint : seg5.endPoint,
         normal : new BABYLON.Vector3(0, 0, -1),
         startUpAxis: seg5.endUpAxis,
         bConvex : false   // No need of upAxis as that changes continuously
    });


    var seg7 = new StraightSegment({
        startPoint : seg6.endPoint,
        direction  : new BABYLON.Vector3(-1, 0, 0),
        startUpAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var center = seg7.endPoint.clone();
    center.addInPlace(seg6.normal.scale(-radius));
    var normal = seg7.startUpAxis.clone();
    //normal = normal.negate();
    var upAxis = normal.clone();
    var seg8_1 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2,
         startPoint : seg7.endPoint,
         normal : normal,
         startUpAxis: upAxis
    });
    
    var seg8_2 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI/2,
         startPoint : seg8_1.endPoint,
         normal : normal,
         startUpAxis: upAxis
    });

    mapSegments[1] =seg1;
    mapSegments[2] =seg2;
    mapSegments[3] =seg3;
    mapSegments[4] =seg4_1;
    mapSegments[5] =seg4_2;
    mapSegments[6] =seg5;
    mapSegments[7] =seg6;
    mapSegments[8] =seg7;
    mapSegments[9] =seg8_1;
    mapSegments[10] =seg8_2;

}


function simpleChairTrack(scene)
{
   var trackLen = 50;
    var radius = 50;
    
    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: true
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    // Y axis is up, x forward, z to the left, left handed system

    // upward curve
   var seg2 = new CircularSegment({
         center : new BABYLON.Vector3(trackLen, radius, 0),
         radius : radius,
         angle : Math.PI / 2,
         startPoint : new BABYLON.Vector3(trackLen, 0, 0),
         normal : new BABYLON.Vector3(0, 0, +1),
         bConvex : false
    });

    // 90 degree turn to plate
    var center = seg2.endPoint.clone();
    center.addInPlace(seg2.normal.scale(-radius));
    var normal = seg2.unitvecEndRadius.clone();
    normal = normal.negate();
    var upAxis = normal.clone();
    var seg3 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg2.endPoint,
         normal : normal,
         upAxis: upAxis
    });


    var center = seg2.center.clone();
    center.z -= radius*2;
    var seg4 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI / 2,
         startPoint : seg3.endPoint,
         normal : new BABYLON.Vector3(0, 0, -1),
         bConvex : false
    });


    var seg5 = new StraightSegment({
        startPoint : seg4.endPoint,
        direction  : new BABYLON.Vector3(-1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var center = seg5.endPoint.clone();
    center.addInPlace(seg4.normal.scale(-radius));
    var normal = seg5.upAxis.clone();
    //normal = normal.negate();
    var upAxis = normal.clone();
    var seg6 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg5.endPoint,
         normal : normal,
         upAxis: upAxis
    });

    track.addSegmentAtEnd(seg1);
    track.addSegmentAtEnd(seg2);
    track.addSegmentAtEnd(seg3);
    track.addSegmentAtEnd(seg4);
    track.addSegmentAtEnd(seg5);
    track.addSegmentAtEnd(seg6);

    return { loco: getDefaultLoco(scene, track), track: track};
}



function fullCircleTrack(scene)
{
   var trackLen = 50;
    var radius = 50;
    
    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: true
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var seg2 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen, 0, -radius),
        radius : radius,
        angle : Math.PI,
        startPoint : seg1.endPoint,
        normal: new BABYLON.Vector3(0, 1, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
    });

    var seg3 = new StraightSegment({
        startPoint : seg2.endPoint,
        direction  : new BABYLON.Vector3(-1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var seg4 = new CircularSegment({
        center : new BABYLON.Vector3(0, 0, -radius),
        radius : radius,
        angle : Math.PI,
        startPoint : seg3.endPoint,
        normal: new BABYLON.Vector3(0, 1, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
    });

    track.addSegmentAtEnd(seg1);
    track.addSegmentAtEnd(seg2);
    track.addSegmentAtEnd(seg3);
    track.addSegmentAtEnd(seg4);

    return { loco: getDefaultLoco(scene, track), track: track};
}



function archTrack(scene)
{
    var trackLen = 50;
    var radius = 50;
    
    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: false
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var seg2 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen, radius, 0),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : new BABYLON.Vector3(trackLen, 0, 0),
        normal: new BABYLON.Vector3(0, 0, 1),
        bConvex: false
    });
    
    var seg3 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen + radius*2, radius, 0),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg2.endPoint,
        normal: new BABYLON.Vector3(0, 0, -1),
        bConvex: true
    });
    
    var seg4 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen + radius*2, radius, 0),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg3.endPoint,
        normal: new BABYLON.Vector3(0, 0, -1),
        bConvex: true
    });

    var seg5 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen + radius*4, radius, 0),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg4.endPoint,
        normal: new BABYLON.Vector3(0, 0, 1),
        bConvex : false
    });

    var seg6 = new StraightSegment({
        startPoint : seg5.endPoint,
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    track.addSegmentAtEnd(seg1);
    track.addSegmentAtEnd(seg2);
    track.addSegmentAtEnd(seg3);
    track.addSegmentAtEnd(seg4);
    track.addSegmentAtEnd(seg5);
    track.addSegmentAtEnd(seg6);

    return { loco: getDefaultLoco(scene, track), track: track};
}



function planeTrack(scene)
{
    var trackLen = 50;
    var radius = 50;
    
        // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: false
        //bLoop: true
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var seg2 = new CircularSegment({
        center : new BABYLON.Vector3(trackLen, 0, -trackLen),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : new BABYLON.Vector3(trackLen, 0, 0),
        normal: seg1.upAxis,
        upAxis: new BABYLON.Vector3(0, 1, 0)
    });
    
    var seg3 = new CircularSegment({
        center : new BABYLON.Vector3(150, 0, -trackLen),
        radius : radius,
        angle : Math.PI / 2,
        startPoint : seg2.endPoint,
        normal: new BABYLON.Vector3(0, -1, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0)
    });

    track.addSegmentAtEnd(seg1);
    track.addSegmentAtEnd(seg2);
    track.addSegmentAtEnd(seg3);

    return { loco: getDefaultLoco(scene, track), track: track};
}

function upHillTrack(scene)
{
    var trackLen = 50;
    var radius = 50;
    
    // Create track - y is up
    var track = new RailTrack({
        version: 0.1,
        bLoop: true
    });

    // Line going straight down x axis
    var seg1 = new StraightSegment({
        startPoint : new BABYLON.Vector3(0, 0, 0),
        direction  : new BABYLON.Vector3(1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    // Y axis is up, x forward, z to the left, left handed system

    // upward curve
   var seg2 = new CircularSegment({
         center : new BABYLON.Vector3(trackLen, radius, 0),
         radius : radius,
         angle : Math.PI / 6,
         startPoint : new BABYLON.Vector3(trackLen, 0, 0),
         normal : new BABYLON.Vector3(0, 0, +1),
         bConvex: false   // No need of upAxis as that changes continuously
    });

    // 90 degree turn to plate
    var center = seg2.endPoint.clone();
    center.addInPlace(seg2.normal.scale(-radius));
    var normal = seg2.unitvecEndRadius.clone();
    normal = normal.negate();
    var upAxis = normal.clone();
    var seg3 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg2.endPoint,
         normal : normal,
         upAxis: upAxis
    });


    var center = seg2.center.clone();
    center.z -= radius*2;
    var seg4 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI / 6,
         startPoint : seg3.endPoint,
         normal : new BABYLON.Vector3(0, 0, -1),
         bConvex : false   // No need of upAxis as that changes continuously
    });


    var seg5 = new StraightSegment({
        startPoint : seg4.endPoint,
        direction  : new BABYLON.Vector3(-1, 0, 0),
        upAxis: new BABYLON.Vector3(0, 1, 0),
        segmentLength : trackLen
    });

    var center = seg5.endPoint.clone();
    center.addInPlace(seg4.normal.scale(-radius));
    var normal = seg5.upAxis.clone();
    //normal = normal.negate();
    var upAxis = normal.clone();
    var seg6 = new CircularSegment({
         center : center,
         radius : radius,
         angle : Math.PI,
         startPoint : seg5.endPoint,
         normal : normal,
         upAxis: upAxis
    });
    
    track.addSegmentAtEnd(seg1);
    track.addSegmentAtEnd(seg2);
    track.addSegmentAtEnd(seg3);
    track.addSegmentAtEnd(seg4);
    track.addSegmentAtEnd(seg5);
    track.addSegmentAtEnd(seg6);

    return { loco: getDefaultLoco(scene, track), track: track};
}

function getDefaultLoco(scene, track, chassis)
{
    var chassisHeight = 1.5;
    var wheelDrop = -1.0;
    var wheelXPos = 9.0;
    var wheelZPos = 1.5;

    return new FastLoco({
        scene: scene,
        iFrontSegment: 0,
        direction: DIRECTION.FORWARD,
        fSpeed: 3.0,
        fAccel: 0.0,
        track: track,
        chassisBody: chassis,
        chassisHeight: chassisHeight,           // Ht from base plane(same as the plane in which the line joining fp & bp lies)
        fVehicleLength: 20,
        frontPointWS: new BABYLON.Vector3(25, 0, 0),
        wheelInfo: [
            { 
                wheelConnectionPoint: new BABYLON.Vector3(wheelXPos, wheelDrop, wheelZPos),
                wheelMesh: "frontLeftWheel",
                wheelRadius: 0.5
            },
            { 
                wheelConnectionPoint: new BABYLON.Vector3(wheelXPos, wheelDrop, -wheelZPos),
                wheelMesh: "frontRightWheel",
                wheelRadius: 0.5
            },
            {
                wheelConnectionPoint: new BABYLON.Vector3(-wheelXPos, wheelDrop, wheelZPos),
                 wheelMesh: "rearLeftWheel",
                 wheelRadius: 0.5
            },
            {
                wheelConnectionPoint: new BABYLON.Vector3(-wheelXPos, wheelDrop, -wheelZPos),
                wheelMesh: "rearRightWheel",
                wheelRadius: 0.5
            },

        ]
    });
}