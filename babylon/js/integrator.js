/**
 * Integrator namespace
 * The below syntax allows extending this namespace across different .js files
 * http://stackoverflow.com/questions/881515/how-do-i-declare-a-namespace-in-javascript
 */
var Integrator = Integrator || {};

 
 //----------------------------------------------------------------------------------------------------------------------------------
/**
 * Integrate using Euler for uniform acceleration
 */
Integrator.euler = function(x, v, a, dt)
{
    //Euler
    x = x + v * dt; 
    v = v + a * dt;

    console.log("Euler: Position: " + x + ", velocity:" + v);

    return {
        x: x,
        v: v
    };
};


//----------------------------------------------------------------------------------------------------------------------------------
/**
 * Integrate using Verlet for uniform acceleration
 */
Integrator.verlet = function(x, v, a, dt)
{
    var v1 = v + a * dt;
    x = x + (v + v1) * 0.5 * dt;

    //console.log("Verlet: Position: " + x + ", velocity:" + v1);

    return {
        x: x,
        v: v1
    };
}


//----------------------------------------------------------------------------------------------------------------------------------
/**
 * Integrate using RK4 for non-uniform acceleration
 * Converted from Python version: http://doswa.com/2009/01/02/fourth-order-runge-kutta-numerical-integration.html
 */
Integrator.rk4 = function(x, v, a, dt) {
    // Returns final (position, velocity) array after time dt has passed.
    //        x: initial position
    //        v: initial velocity
    //        a: acceleration function a(x,v,dt) (must be callable)
    //        dt: timestep
    var x1 = x;
    var v1 = v;
    var a1 = a(x1, v1, 0);

    var x2 = x + 0.5*v1*dt;
    var v2 = v + 0.5*a1*dt;
    var a2 = a(x2, v2, dt/2);

    var x3 = x + 0.5*v2*dt;
    var v3 = v + 0.5*a2*dt;
    var a3 = a(x3, v3, dt/2);

    var x4 = x + v3*dt;
    var v4 = v + a3*dt;
    var a4 = a(x4, v4, dt);

    x = x + (dt/6)*(v1 + 2*v2 + 2*v3 + v4);
    v = v + (dt/6)*(a1 + 2*a2 + 2*a3 + a4);

    console.log("rk4: Position: " + this.x + ", velocity:" + this.v);

    return {
        x: x,
        v: v
    };
}

/**
 * Sample acceleration function for rk4 testing - spring damping
 */
Integrator.acceleration = function(x, v, stiffness, damping) 
{
    // This is the acceleration function
    return -stiffness*x-damping*v;
}




