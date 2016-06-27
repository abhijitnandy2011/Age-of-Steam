/**
 * A train consists of multiple rail vehicles
 * It could be locos, coaches, self propelled units or any combination of these
 * A Train has speed, acceleration etc, individual RailVehicles do not 
 * All move/accelerate together or the train will break
 */
function Train(json)
{
    // Distance covered since starting
    this.fDistance = 0;

    // Sequence of vehicles in train
    this.vehicles = [];

    // Map of RailVehicle ID vs RailVehicle obj
    this.mapVehicleIDvsVehicleObj = {};

    // Init this object from the json map
    this.fromJSON(json);
    
    // Braking flags
    this.bNormalBrakesActive = false;
    this.bEmergencyBrakesActive = false;

    this.bInError = false
}

// Returns a simple JSON object(map) of values built from the state of this object
// It can be used to recreate this object if passed to the ctor
Train.prototype.toJSON = function()
{
    var json = {};

    // Add basic data like train name, speed, acceleration, position of lead vehicle
    
    // Add types of individual vehicles & any vehicle specific data

    return json;
}

// Initialize this object from the passed json obj
Train.prototype.fromJSON = function(json)
{
    this.name = json.name;

    this.fPrevSpeed = 0;   // helps to find whether train stopped in this iteration or before 
    this.fSpeed = json.fSpeed;
    if (this.fSpeed < FLOAT.ZERO) {
        // This flag is used to update the vehicle's backsegment when train just stopped
        // but not again if the train is still halted. This is to save on the calc. if
        // the train has stopped moving. But we must at least update the back seg if the
        // train stopped at this iteration as the front point moved, potentially changing
        // the back seg & surely changing the back point & front point of all vehicles.
        this.bHaltedInPrevIterAndStillHalted = true;
    }

    this.fPrevAccel = 0
    this.fAccel = json.fAccel;
    
    this.direction = json.dir;  // Forward/Backward - relevant for engine/seating dir

    this.railway = json.railway ;
    this.track   = json.track;
    this.trackID = json.trackID;
    this.linkLen = json.linkLen;
    
    // Get the default chassis mesh
    var scene = this.railway.scene;
    var chassis = scene.getMeshByName("chassis");
    chassis.material.ambientColor  = new BABYLON.Color3(1.0, 1.0, 1.0);
    chassis.material.wireframe = true;

    var flwMesh = scene.getMeshByName("frontLeftWheel");
    var frwMesh = scene.getMeshByName("frontRightWheel");
    var rlwMesh = scene.getMeshByName("rearLeftWheel");
    var rrwMesh = scene.getMeshByName("rearRightWheel");

    // Create vehicles
    for (idx = 0; idx < json.vehicles.length; ++idx ) {
        var wheelDrop = -1.0;
        var wheelXPos = 9.0;
        var wheelZPos = 1.5;
        var vehicleJson = json.vehicles[idx];

        // All vehicles inited on top of each other at same position & segment, their
        // actual positions are set at the first update() when the train calc
        // the front points & the vehicles their own back points.
        var newVehicle = new RailVehicle({
            id: vehicleJson.id,
            type: vehicleJson.t,
            iFrontSegment: vehicleJson.frontSeg,
            frontPointWS: BABYLON.Vector3.FromArray(vehicleJson.fp, 0),
            track: this.track,
            train: this,
            chassisBody: chassis.clone(),
            chassisLength: json.carLen, // these will need to be made car specific later
            chassisWidth: json.carWidth,
            chassisHeight: json.carHt,           // Ht from base plane(same as the plane in which the line joining fp & bp lies)
            wheelInfo: [
                {
                    wheelConnectionPoint: new BABYLON.Vector3(wheelXPos, wheelDrop, wheelZPos),
                    wheelMesh: flwMesh.clone(),
                    wheelRadius: 0.5
                },
                {
                    wheelConnectionPoint: new BABYLON.Vector3(wheelXPos, wheelDrop, -wheelZPos),
                    wheelMesh: frwMesh.clone(),
                    wheelRadius: 0.5
                },
                {
                    wheelConnectionPoint: new BABYLON.Vector3(-wheelXPos, wheelDrop, wheelZPos),
                    wheelMesh: rlwMesh.clone(),
                    wheelRadius: 0.5
                },
                {
                    wheelConnectionPoint: new BABYLON.Vector3(-wheelXPos, wheelDrop, -wheelZPos),
                    wheelMesh: rrwMesh.clone(),
                    wheelRadius: 0.5
                },
            ]
        });

        // Update map & array containers of the rail vehicles - this lets use
        // look up RailVehicles by id & go through them in same seq as in the train
        this.mapVehicleIDvsVehicleObj[vehicleJson.id] = newVehicle;
        this.vehicles.push(newVehicle);
    }

    // Dispose off template meshes
    chassis.dispose();
    flwMesh.dispose();
    frwMesh.dispose();
    rlwMesh.dispose();
    rrwMesh.dispose();
}


// Get vehicle front point & segment
Train.prototype.updateLeadVehicleFrontSegment = function(dx)
{
    var lead = this.vehicles[0];
    lead.frontPointPreviousWS = lead.frontPointWS;

    // Update state
    this.fDistance += dx;  // total distance covered so far

    // Convert dx to point in WS
    // This means looping from fs to succeeding segments in this.direction till dx consumed
    // that would be the segment fp lies on after this iteration. It may be fs again or some 
    // succeeding segment but it should not loop back to fs !! Make segments really long!

    // Start from fs as we may well end up here - account for distance moved in fs
    var currentSegment = lead.iFrontSegment;
    var currentSegDiff = 0;

    // This is used for updating wheel rotation.
    // We assume dx as measured along a track lying in between the 2 rails of a real
    // track.
    // This is incorrect - each coach may have different delta based on it's front 
    // point's previous position along the track. Also it will vary based on whether
    // its the inner or outer wheel - they are on different tracks - these should be
    // accounted for later. TODO
    // Currently lead vehicle's delta is all vehicle's delta
    lead.frontPointDelta = dx;

    //console.debug("lead.frontPointDelta = " + lead.frontPointDelta);


    // This is very important - it ensures that when we deduct the whole of the front segment's
    // length from the distance passed to getPointFromDistanceOnSegment(), the remaining value is correct
    // getPointFromDistanceOnSegment(dx) must contain the distance covered in this segment too or we 
    // cannot subtract the whole of the current segment's length from it.
    // We must start as if we are just entering the current front segment.    
    dx += lead.fDistCoveredInFrontSegment;  // total distance covered on current fs so far

    // Prevent floating point errors - TODO is this needed still? Must test!
    dx = Math.round(dx * FLOAT.MAX_DP_MULTPLR) / FLOAT.MAX_DP_MULTPLR;

    do {
        console.debug("dx = " + dx + ", currentSegment:" + currentSegment + ", lead.fDistCoveredInFrontSegment" + lead.fDistCoveredInFrontSegment);
        
        var pointInfo = this.track.getSegment(currentSegment).getPointFromDistanceOnSegment(dx);

        if (pointInfo.distLeft < FLOAT.ZERO) {
            // fs found
            break;
        }

        // Subtract distance consumed by this iteration
        dx = pointInfo.distLeft;

        // Circulate segment index chking for 0, max etc
        currentSegment = this.track.getNextSegment(currentSegment);
        if (currentSegment < 0) {
            // End of the line, the currentSegment must be restored to the current front seg
            // And we must not continue hunting further for front seg
            console.debug("End of line. currentSegment:" + currentSegment + ". Train will halt. Speed and acceleration has been zeroed.");
            this.railway.alert("End of line. Train will halt. Speed and acceleration has been zeroed. Refresh the page to restart.");

            // At end-of-line, the lead vehicle front pnt has covered the entire front seg distance,
            // so fDistCoveredInFrontSegment is set to that directly. Else leaving 
            // fDistCoveredInFrontSegment = dx is incorrect as dx contains the small distance still left to cover in the hypothetical next segment - but there is no next seg, this is the last
            // Note: If the line loops we will never come here as 
            // this.track.getNextSegment(currentSegment) will return 0 which is the first segment's index 
            // & not -1
            lead.fDistCoveredInFrontSegment = this.track.getSegment(lead.iFrontSegment).segmentLength;
            lead.frontPointWS = this.track.getSegment(lead.iFrontSegment).endPoint;
            this.fAccel = 0;
            this.fSpeed = 0;
            return false;
        }
        else if (lead.iFrontSegment > 0 && currentSegment == 0 && this.track.bLoop == true) {
            // We have looped the line & returned to starting segment as looping is permitted
            continue;
        }

        currentSegDiff = Math.abs(currentSegment - lead.iFrontSegment);
    } while(currentSegDiff <= this.track.MAX_SEGMENT_INCREMENT)
    // While searching ahead for fs we went too far ahead - this is too fast !!

    // Is it warp speed ?
    if (currentSegDiff > this.track.MAX_SEGMENT_INCREMENT) {
        this.bInError = true;
        console.error("[ERROR] While finding frontPoint. Segment increment too high. Sim stopped.");
        return false;
    }

    // Update
    // Total distance covered on current fs so far
    // dx will have last segment dist left before distLeft became 0 - see above do-while loop
    lead.fDistCoveredInFrontSegment = dx;
    lead.frontPointWS = pointInfo.pointOnSegment;
    lead.iFrontSegment = currentSegment;
    
    console.debug("fp(" + lead.frontPointWS.x + "," + lead.frontPointWS.y + "," + lead.frontPointWS.z + ")");

    return true;
}


Train.prototype.updateLinkedVehicleFrontSegment = function(dt, idx)
{
    var prevVeh = this.vehicles[idx-1];
    var prevVehBackSeg = this.track.getSegment(prevVeh.iBackSegment)
    
    // Find out how much the dist the prev vehicle's back pnt has covered on its back segment
    var fDistCovdByBackPointOnBackSeg = prevVehBackSeg.getDistanceFromPointOnSegment(prevVeh.backPointWS);

    // Use the above info to find out if adding a link backwards from the back pnt will fit 
    // into the back seg of the previous vehicle
    var accommInfo = prevVehBackSeg.isBackPointWithinSegment(fDistCovdByBackPointOnBackSeg, this.linkLen);
    if (accommInfo.bCanBeAccommodated) {
        // Yes it will, so the point where the link ends is the new 
        // frontPointWS for THIS vehicle
        this.vehicles[idx].frontPointWS  = accommInfo.point;
        
        // The dist covd by this new front point on prevVehBackSeg is the 
        // new fDistCoveredInFrontSegment for THIS vehicle
        this.vehicles[idx].fDistCoveredInFrontSegment = prevVehBackSeg.getDistanceFromPointOnSegment(accommInfo.point);
        
        // Finally set the segment number
        this.vehicles[idx].iFrontSegment = prevVeh.iBackSegment;
        // frontPointDelta reqd for rotating the wheels - its currently kept same as the delta of
        // the prev vehicle - ultimately this is the frontPointDelta of the lead vehicle
        // This is incorrect as the frontPointDelta of all vehicles may not be same - TODO
        this.vehicles[idx].frontPointDelta = prevVeh.frontPointDelta;
        return true;
    }

    // Otherwise, the front point of this vehicle lies in the segment before prevVehBackSeg
    var iPrevSegment = this.track.getPreviousSegment(prevVeh.iBackSegment);
    var prevSegment  = this.track.getSegment(iPrevSegment);
    
    // calculating sphere intersection
    // Try intersecting a sphere centred at location of back pnt in WS &
    // rad = link length with the previous segment
    var intersectInfo = prevSegment.getIntersectionWithSphere(
                                                  prevVeh.backPointWS,
                                                  this.linkLen);
    if (intersectInfo.bFound) {
        // The front point of this vehicle was found on the prev segment - intersection MUST be found
        this.vehicles[idx].frontPointWS = intersectInfo.point;
        // The distance covd by the new front point of this vehicle on the prev seg - which is THIS vehicle's 
        // front seg now.
        this.vehicles[idx].fDistCoveredInFrontSegment = prevSegment.getDistanceFromPointOnSegment(intersectInfo.point);
        this.vehicles[idx].iFrontSegment  = iPrevSegment;
        this.vehicles[idx].frontPointDelta = prevVeh.frontPointDelta;
    }
    else {
        console.error("[ERROR] While finding link end for front point of linked vehicle. Sim stopped.");
        return false;
    }

}


// Updates the train - if an error occurs it returns
// In that case the calling function needs to check the error flag 
// and not call this function again. This function does not check bInError
// for performance.
Train.prototype.update = function(dt, scene)
{
    // Apply loco speed on train right away !
    // If train is already running it will not start at the exact spot 
    // when the user sees it. Start PAUSED to ensure that.
    
    // Using Verlet as acceleration is uniform
    // Use RK4 for non-uniform
    var frontState = Integrator.verlet(0,  // x = 0 to get dx
                                   this.fSpeed,
                                   this.fAccel,
                                   dt);
    // NOTE: We have no negative displacement, speed or acceleration in the system
    // All backward movement is by reversing the direction - no negative parameters
    this.fSpeed = frontState.v;
    if(this.fSpeed < 0) {
        this.fSpeed = 0;
    }
    
    // No -ve displacement - to go backwards we go +ve but in opp dir
    var dx = frontState.x;
    if (dx < 0) {
        dx = 0;
    }
    
    //console.log("speed:" + this.fSpeed + ", accel:" + this.fAccel);
    this.railway.speedNode.nodeValue = this.fSpeed;
    this.railway.accelNode.nodeValue = this.fAccel;
    

    // This check will actually happen in the iter after the one in which speed
    // is zeroed. So by then all front and back segs will have been updated fully
    // by taking into account all distance moved. So we can use this flag & need
    // nothing else.
    if (this.fSpeed < FLOAT.ZERO) {
        this.bSpeedZeroedInPrevIter = true;
    }
    else {
        this.bSpeedZeroedInPrevIter = false;
    }

    // We need to check if the train is moving. 
    // this.fSpeed was made < FLOAT.ZERO in previous iteration, then no need to
    // update front point or segment, else there is movement.
    if (!this.bSpeedZeroedInPrevIter || !this.railway.bFirstIterationOver) {
        // Update first vehicle separately
        // First update front segment by applying the distance moved
        // This is the only instance where we search for segments forward of the train
        if (this.updateLeadVehicleFrontSegment(dx) == false) {
            // Check for an error condition
            if (this.bInError) {  
                // this.bInError is set from updateLeadVehicleFrontSegment()
                // We cannot proceed further
                return false;
            }
            /*else { 
             // updateLeadVehicleFrontSegment = false as train reached
             end-of-line, we still need to update back seg, or this iter front
             seg update & back seg update will be lost.
            }*/
        }
    }

    // update() is always called to 
    // - update the back segment and
    // - other aspects
    // The vehicles can check the Train's bHaltedInPrevIterAndStillHalted to 
    // stop back seg calc.
    if (!this.vehicles[0].update(dt)){
        this.bInError = true; // if vehicles[idx].update() returns false it must be an error(for now)
        return false;
    }

    // Update all remaining vehicles - now its all a search backwards
    for (idx = 1; idx < this.vehicles.length; ++idx ) {

        // Update front point of next vehicle if train is moving
        // This happens in *this* object(the Train) and not the individual vehicles
        // So its not put in their vehicles[idx].update()
        if (!this.bSpeedZeroedInPrevIter || !this.railway.bFirstIterationOver) {
            this.updateLinkedVehicleFrontSegment(dt, idx);
        }

        // Update back seg & other aspects
        if (!this.vehicles[idx].update(dt)) {
            this.bInError = true; // if vehicles[idx].update() returns false it must be an error(for now)
            return false;
        }
    }

    return true;
}