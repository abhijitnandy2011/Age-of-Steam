// Start off the train from here !!

// Gfx
var engine;
var canvas;
var scene;
var lines;
var aosRenderFunction;


// Railway stuff
var gRailway;
var logit = console.debug;
var gPaused = false;

FLOAT = {
    ZERO : 1e-6,
    MAX_DECIMAL_PLACES : 6,
    MAX_DP_MULTPLR : Math.pow(10, 6)  // used to round of to MAX_DECIMAL_PLACES & prevent rounding errors
}

var MAX_ACCEL = 5;
var NORMAL_ACCEL = 0.1;
var BRAKING_ACCEL = -0.2;
var BRAKING_EMERGENCY_ACCEL = -0.5;

// -------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", startGame, false);
function startGame() {
    if (BABYLON.Engine.isSupported()) {

        canvas = document.getElementById("renderCanvas");
        engine = new BABYLON.Engine(canvas, true);

        // Add keyboard listeners right away
        addListeners();

        BABYLON.SceneLoader.Load("", "scenes/dummy.babylon", engine, function (scene) {
            // Wait for textures and shaders to be ready
            scene.executeWhenReady(function () {
            
                var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI * 1.2, Math.PI / 3, 20, BABYLON.Vector3.Zero(), scene);
                camera.setPosition(new BABYLON.Vector3(0, 15, -30));
                scene.activeCamera = camera;
                
                chassis = scene.getMeshByName("chassis");
                chassis.material.ambientColor  = new BABYLON.Color3(1.0, 1.0, 1.0);
                chassis.material.wireframe = true;
                //chassis.scaling = new BABYLON.Vector3(1,1,1);


               // chassis.dispose();

             /*   chassis = BABYLON.Mesh.CreateBox("chassis", 1, scene, false);

                cab = BABYLON.Mesh.CreateBox("cab", 1, scene, false);
                cab.position.y = 2;
                cab.position.x = -2;
                cab.parent = chassis;
                //cab.scaling.x = 1;

                chassis.scaling.x = 20;
                chassis.scaling.z = 2;*/

               /* frontLeftWheel = scene.getMeshByName("frontLeftWheel");
                frontLeftWheel.parent = chassis;*/

         
                // Attach camera to canvas inputs
                scene.activeCamera.attachControl(canvas);
                // Might need this later
               // scene.activeCamera.setTarget(chassis.position);  // TEST THIS

                // Debug layer
                //scene.forceWireframe = true;
                scene.debugLayer.show(false);

                scene.debugLayer.axisRatio = 0.2;
                scene.debugLayer.shouldDisplayAxis = function (mesh) {
                    return mesh.name === "chassis";
                }
                scene.debugLayer.shouldDisplayLabel = function (node) {
                    return false;
                }
                scene.debugLayer.show();

                // Once the scene is loaded, just register a render loop to render it
                engine.runRenderLoop(function() {
                    scene.render();
                });
                
                $.getJSON("data/test.json", function(jsonObj) {
                    //console.log(json); // this will show the info it in firebug console
                    postJSONLoad(scene, jsonObj);
                })
                  .fail(function() {
                    console.error( "JSON parsing error" );
                  })
                  .always(function() {
                    console.log( "JSON parsing complete" );
                  });

            });
        }, function (progress) {
            // To do: give progress feedback to user
        });
 
    }
    else {
        // Say Babylon is not supported
    }
}


// ---------------------------------------------------------------------------------------------------------------------------
// Add any listeners here
function addListeners() {
    window.addEventListener("keydown", function (event) {
        var up = (event.type == 'keyup');

        if(!up && event.type !== 'keydown'){
            return;
        }

        // keyCode is case insensitive
        switch(event.keyCode) {
        case 87: // w - forward
            if (gRailway.focussedTrain.bNormalBrakesActive) {
                gRailway.alert("Deactivate the NORMAL brakes first(Press Shift + B)!");
            }
            else if(gRailway.focussedTrain.bEmergencyBrakesActive){
                gRailway.alert("Deactivate the EMERGENCY brakes first(Press Shift + E)!");
            }
            else {
                gRailway.focussedTrain.fAccel += NORMAL_ACCEL;
                if ( gRailway.focussedTrain.fAccel > MAX_ACCEL) {
                    gRailway.focussedTrain.fAccel = MAX_ACCEL;
                }
            }
            break;

        case 83: // s - backward
            if (gRailway.focussedTrain.fAccel > 0) {
                gRailway.focussedTrain.fAccel -= NORMAL_ACCEL;
            }
            if (gRailway.focussedTrain.fAccel < 0) {
                gRailway.focussedTrain.fAccel = 0;
            }
            break;

        case 66: // b
            if(event.shiftKey){
                // Shift + b: Brake release
                gRailway.focussedTrain.fAccel = 0;
                gRailway.normalBrakeNode.nodeValue = "OFF";
                gRailway.focussedTrain.bNormalBrakesActive = false;
                gRailway.alert("");
            }
            else {
                // b - activate braking accel
                gRailway.focussedTrain.fAccel = BRAKING_ACCEL;
                gRailway.normalBrakeNode.nodeValue = "ON";
                gRailway.focussedTrain.bNormalBrakesActive = true;
            }
            break;
            
        case 69: // e
            if(event.shiftKey){
                // Shift + e: emergency brake release
                gRailway.focussedTrain.fAccel = 0;
                gRailway.emergencyBrakeNode.nodeValue = "OFF"
                gRailway.focussedTrain.bEmergencyBrakesActive = false;
                gRailway.alert("");
            }
            else {
                // e - activate emergency braking accel
                gRailway.focussedTrain.fAccel = BRAKING_EMERGENCY_ACCEL;
                gRailway.emergencyBrakeNode.nodeValue = "ON"
                gRailway.focussedTrain.bEmergencyBrakesActive = true;
            }
            break;

        case 65: // a 
            break;

        case 68: // d 
            break;

         case 32:  // SPACE - pause sim
            gPaused = !gPaused
            if (gPaused) {
                gRailway.alert("Game is paused");
            }
            else {
                gRailway.alert("");
            }
            break
            
         case 70:  // "F" - write out game state
            console.debug("Writing out the game state...");
            var json = gRailway.toJSON();
            // Add version info & other game info
            console.debug(json)
            break

        }
    });

    window.addEventListener("keyup", function (event) {
    });

}

function postJSONLoad(scene, json) 
{
    // The rail physics engine
    createRailway(scene, json);
    //integrator = new Integrator();

    aosRenderFunction = function(){
        // Independent
        //integrator.euler(0.1);
        
        // Independent
        //integrator.rk4(0.1);
        
        //chassis.position.x = integrator.x;

        //var dt = engine.getDeltaTime();
        //console.log(dt/1000)

        // Draws scene as well
        //updateScene(dt/1000, scene);
        updateScene(0.1, scene);
    }


    scene.registerBeforeRender(aosRenderFunction);
}

// ---------------------------------------------------------------------------------------------------------------------------
// Create the loco, tracks etc
function createRailway(scene, json)
{
    // Downloaded json ignored currently - test.json is not correct yet

    var obj = rainHillTrialsRailway();
    obj.scene = scene;
    gRailway = new Railway(obj);

    //var retMap = upHillTrack(scene);
    //var retMap = archTrack(scene);
    //var retMap = planeTrack(scene);
    //var retMap = fullCircleTrack(scene)
    //var retMap = simpleChairTrack(scene);
    //var retMap = realChairTrack(scene);
    //var retMap = crazyTrack(scene);

    //gLoco = retMap.loco;
    //gTrack = retMap.track;

    // Serialize relevant properties of the track, those that cant be calc
    // Be sure to version these
    //var jsonString = JSON.stringify(gTrack, ["MAX_VEHICLE_SEGMENT_DIFF"], 4);
 //   var jsonString = gTrack.stringify()
  //  console.log(jsonString)
}

// Update loco & geometry
function updateScene(dt, scene) 
{

    // Update the Railway
    if (!gPaused && !gRailway.update(dt)) {
        // There was an error - unregister render func
        // TODO: Instead of unreg the render function we could continue to 
        // receive scene updateRequests but mark a flag to set an error condition
        // in Railway. Then render only the HUD and other useful debugging stuff.
        scene.unregisterBeforeRender(aosRenderFunction);
        console.error("Error in railway, deregistering rendering function.");
    }

}