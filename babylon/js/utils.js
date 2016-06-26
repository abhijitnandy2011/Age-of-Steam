// Globals

/**
 * Track Enums
 */
 
SEGMENTTYPE = {
    STRAIGHT : 1,
    CIRCLE : 2
}

DIRECTION = {
    FORWARD : 1,
    BACKWARD : -1
}

vecprint = function(msg, vec)
{
    console.debug(msg + "(" + vec.x + "," + vec.y + "," + vec.z + ")");
}

// utils namespace
function utils(){}

/**
 * Extend an options object with default values.
 * @static
 * @method defaults
 * @param  {object} options The options object. May be falsy: in this case, a new object is created and returned.
 * @param  {object} defaults An object containing default values.
 * @return {object} The modified options object.
 */
utils.defaults = function(options, defaults){
    options = options || {};

    for(var key in defaults){
        if(!(key in options)){
            options[key] = defaults[key];
        }
    }

    return options;
};


/**
 * Round off each component of a BABYLON.Vector3 object
 * @static
 * @floating point rounding
 * @param  {object} vec
 * @param  {int} precision
 * @return none, works by reference on vec
 */
utils.roundVector3 = function(vec, precision){
    vec.x = Math.round(vec.x * precision) / precision;
    vec.y = Math.round(vec.y * precision) / precision;
    vec.z = Math.round(vec.z * precision) / precision;
};
