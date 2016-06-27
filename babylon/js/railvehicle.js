
/**
 * RailVehicle class that moves a loco through Verlet or RK4 time integration
 * @class RailVehicle
 * @constructor
 * @param {object} [json]
 */
function RailVehicle(json)
{
    this.fromJSON(json);

    // ------------ State --------------
    this.positionWS = new BABYLON.Vector3(0, 0, 0);

    /**
     * Yaw in WS - calculated after fp * bp updated.
     * This is always around up-axis which should be passed in.
     * Pitch and roll is decided by centrifugal force & suspension - TODO
     */
    this.yawWS = new BABYLON.Vector3(0, 0, 0);

    // Up axis in WS - currently y axis
    this.upAxisWS = new BABYLON.Vector3(0, 1, 0);

    // Distance covered since starting
    this.fDistance = 0;

    // ------------ Segment tracking --------------------
    
    // Front & back point in WS
    // this.frontPointWS passed in through options
    this.frontPointPreviousWS; // COFU
    this.backPointWS;
    this.backPointPreviousWS;

    // The distance already covered in fs by fp
    var segment = this.track.getSegment(this.iFrontSegment);
    this.fDistCoveredInFrontSegment = segment.getDistanceFromPointOnSegment(this.frontPointWS);
    if (this.fDistCoveredInFrontSegment < 0) {
        console.error("[ERROR] The distance covered in front segment is wrong. Sim stopped.");
        return;
    }

    var scene = this.train.railway.scene;
    
    this.sphFP = BABYLON.Mesh.CreateSphere("sphere", 10.0, 0.5, scene);
    this.sphBP = BABYLON.Mesh.CreateSphere("sphere", 10.0, 0.5, scene);
    var redMaterial = new BABYLON.StandardMaterial("sphTexture", scene);
    redMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.0, 0.0);
    this.sphFP.material = redMaterial;
    var greenMaterial = new BABYLON.StandardMaterial("sphTexture", scene);
    greenMaterial.diffuseColor = new BABYLON.Color3(0.0, 1.0, 0.0);
    this.sphBP.material = greenMaterial;


    var initialRoll = 0 /*Math.PI*0.1*/;
    //this.chassisBody.rotationQuaternion = new BABYLON.Quaternion.RotationAxis(new BABYLON.Vector3(1,0,0), initialRoll);

    // Used to update wheels
    this.frontPointDelta = 0;

}

// Initialize this object from the passed json obj
RailVehicle.prototype.fromJSON = function(json)
{
    this.id = json.id;
    this.type = json.type;

    this.frontPointWS = json.frontPointWS;
    this.track = json.track;
    this.train = json.train;
    this.chassisBody = json.chassisBody;

    // Has vehicle derailed ?
    this.bDerailed = false;

    // ----------- Dimensions --------------
    this.fVehicleLength = json.chassisLength;
    this.fVehicleWidth  = json.chassisWidth;
    this.fVehicleHeight = json.chassisHeight;
    
        
    /**
     * Front & back point track segments. Used to track where the front & back point is 
     * in world space. These are indices into into track[]
     * backSegment is COFU(calculated on first use)
     * this.iFrontSegment passed in through options
     */
    this.iFrontSegment = json.iFrontSegment;
    this.iBackSegment = -1; // Important to not have bs = fs as bs search must happen on 1st iteration


    // Wheel meshes
    this.wheelInfo = json.wheelInfo;
    for (var idx = 0; idx < this.wheelInfo.length; ++idx) {
        this.wheelInfo[idx].wheelMesh.parent = this.chassisBody;
        this.wheelInfo[idx].wheelMesh.position = this.wheelInfo[idx].wheelConnectionPoint;
        this.wheelInfo[idx].wheelMesh.material.wireframe = true;
    }
}

// Get vehicle trailing point's segment
// Must return true if back segment successfully updated
RailVehicle.prototype.updateBackSegment = function()
{
    this.backPointPreviousWS = this.backPointWS;

    var currentSegment = this.iFrontSegment;

    // Is the back segment == front segment?
   /* if (this.iFrontSegment == this.iBackSegment) {
        // Yes, then simply move back pnt by same distance as was moved by front pnt
        // Update backPointWS only, segment remains same
        this.track.getSegment(currentSegment).interpolatePoint(this.backPointWS, this.frontPointDelta);
        return true;
    }*/
    
    // No, then can back point be accommodated in the front segment?
    var accommInfo = this.track.getSegment(currentSegment).isBackPointWithinSegment(this.fDistCoveredInFrontSegment, this.fVehicleLength);
    if (accommInfo.bCanBeAccommodated) {
        // Yes, find the back point & return
        this.backPointWS = accommInfo.point;
        this.iBackSegment = currentSegment;
        return true;
    }

    // No, then we need to search for an intersection with the previous segment only
    // using sphere intersection. Anything before the previous segment does not interest us.
    // The backSegment can now be only < currentSegment
    // Track segment array gives sequence of segments. If engine reversed, array contents needs to be reversed in track.
    // Track array shouldnt be > 3 or 4 segments as each segment is big and we dont load the whole line at once - this makes it fast to reverse the array.
    currentSegment = this.track.getPreviousSegment(currentSegment);
    
   /* console.debug("fp(" + this.frontPointWS.x + "," + this.frontPointWS.y, + "," + this.frontPointWS.z + "), bp(" + this.backPointWS.x + "," + this.backPointWS.y + "," + this.backPointWS.z + "), currentSegment:" + currentSegment);*/

    // calculating sphere intersection
    // Try intersecting a circle centred at location of front pnt in WS &
    // rad = vehicle length with the segment type of currentSegment
    // In 3d try a sphere
    var intersectInfo = this.track.getSegment(currentSegment).getIntersectionWithSphere(
                                                  this.frontPointWS,
                                                  this.fVehicleLength);
    if (intersectInfo.bFound) {
        // Update backPointWS and segment - intersection MUST be found
        this.backPointWS = intersectInfo.point;
        this.iBackSegment = currentSegment;
    }
    else {
        console.error("[ERROR] While finding backPoint. Back segment=-1. Sim stopped.");
        return false;
    }


    //console.debug("(" + this.backPointWS.x + "," + this.backPointWS.y + "," + this.backPointWS.z + ")" + " - " +
      //  "(" + this.frontPointWS.x + "," + this.frontPointWS.y + "," + this.frontPointWS.z + ")" );

    return true;
}


//---------------------------------------------------------------------------------------------------------------------
// Update position and wheel rotation - all wheels rotate by same amt(for now)
RailVehicle.prototype.update = function(dt)
{
    // Finish all necessary updates that occur irrespective of fSpeed = 0

    // Now for updates which occur only when fSpeed > 0
   /* if (this.train.bSpeedZeroedInPrevIter && this.train.railway.bFirstIterationOver) {
        return true;
    }*/

    // We must know the backpoint & segment before we can draw the coach aligned between the 
    // fp & bp - the bp is calc in the 1st iteration only.
    // If speed zeroed in previous iteration, all distance has been accounted for till
    // train halt in previous iter itself, so no need to update back seg
    if (!this.updateBackSegment()) {
        return false;
    }

    /*console.log("update: id:" + this.id + "(" + this.frontPointWS.x + ")," + this.backPointWS.x);*/

    // Update chassisBody rotation & location in WS using fp & bp
    // Position is mid point of fp & bp
    
    if (!this.forwardVecWS) {
        // For the 1st time only
        this.forwardVecWS = this.frontPointWS.subtract(this.backPointWS);
        this.forwardVecWS.normalize();
    }

    // The forward vector for this iteration - this is different from this.forwardVecWS & assigned to it
    // at the end to update it for next iteration.
    var forwardVecWS = this.frontPointWS.subtract(this.backPointWS);
    this.positionWS = this.backPointWS.add(forwardVecWS.scale(0.5));  // midpoint - must use un-normalized forwardVecWS
    forwardVecWS.normalize();

    // Calculate new up axis - this can change if fp & bp are on different segments or a segment's
    // twist changes the up axis.

    var frontSegment =  this.track.getSegment(this.iFrontSegment);
    var xAxis = forwardVecWS.clone();
    var yAxis = frontSegment.getUpAxis(this.fDistCoveredInFrontSegment).clone();
    var zAxis = BABYLON.Vector3.Cross(xAxis, yAxis).normalize(); // this must be recalculated as original z-axis used to calc y-axis, may not have been perp to x-axis
    yAxis = BABYLON.Vector3.Cross(zAxis, xAxis).normalize();
    // DO NOT calculate x-axis again, that is forwardVecWS & FIXED!

    // Now the graphics update
    this.chassisBody.position = this.positionWS.add(yAxis.scale(this.fVehicleHeight));

   /* var xDotz = BABYLON.Vector3.Dot(xAxis, zAxis);
    var xDoty = BABYLON.Vector3.Dot(xAxis, yAxis);
    var yDotz = BABYLON.Vector3.Dot(yAxis, zAxis);
    
    console.debug("forwardVecWS(" + forwardVecWS.x + "," + forwardVecWS.y + "," + forwardVecWS.z + ")");
    console.debug("x(" + xAxis.x + "," + xAxis.y + "," + xAxis.z + 
               "), y(" + yAxis.x + "," + yAxis.y + "," + yAxis.z +
               "), z(" + zAxis.x + "," + zAxis.y + "," + zAxis.z + ")");

    console.debug("x.z=" + xDotz + ", x.y=" + xDoty + ", y.z=" + yDotz);
    console.debug("Length x=" + xAxis.length() + ", y=" + yAxis.length() + ", z=" + zAxis.length());*/

    this.chassisBody.rotation = BABYLON.Vector3.RotationFromAxis(xAxis, yAxis, zAxis);

    //console.debug("Rotation x=" + this.chassisBody.rotation.x + ", y=" + this.chassisBody.rotation.y + ", z=" + this.chassisBody.rotation.z);
   // console.debug("Position(" + this.chassisBody.position .x + ", " + this.chassisBody.position.y + ", " + this.chassisBody.position.z + ")");

    // Move current forward vector to previous? Is this needed anymore?
    this.forwardVecWS = forwardVecWS;

    for (var idx = 0; idx < this.wheelInfo.length; ++idx) {
        this.wheelInfo[idx].wheelMesh.rotation.z -= this.frontPointDelta / (Math.PI * 0.5);  // div by 2*pi*r gives too little rot
    }


    // ------------- DEBUG --------------
    var scene = this.train.railway.scene;
    this.sphFP.position = this.frontPointWS;
    this.sphBP.position = this.backPointWS;

    var tracerMeshName = "frontPointTracer" + this.id;
    
    // Draw line to point if on circular segment
    if (frontSegment.segmentType == SEGMENTTYPE.CIRCLE) {
        // dispose of any already drawn line on the scene
        if(scene.getMeshByName(tracerMeshName)){
           scene.getMeshByName(tracerMeshName).dispose();
        }

        // finally create the line
        var distanceLine = BABYLON.Mesh.CreateLines(tracerMeshName, [
                frontSegment.center,
                this.frontPointWS
            ], scene);

        // color of the drawn line (here: white)
        distanceLine.color = new BABYLON.Color3(1, 1, 1);

    }


    var bpdiff, fpdiff;
    if (this.backPointPreviousWS)
        bpdiff = BABYLON.Vector3.Distance(this.backPointWS, this.backPointPreviousWS);

    if (this.frontPointPreviousWS)
        fpdiff = BABYLON.Vector3.Distance(this.frontPointWS, this.frontPointPreviousWS);
   // console.debug("bpdiff:" + bpdiff + ", fpdiff:" + fpdiff);


    // ------------- DEBUG --------------


    return true;
}


