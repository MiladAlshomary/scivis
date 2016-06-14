#version 150
//#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

#define TASK 10
#define ENABLE_OPACITY_CORRECTION 0
#define ENABLE_LIGHTNING 0
#define ENABLE_SHADOWING 0

in vec3 ray_entry_position;

layout(location = 0) out vec4 FragColor;

uniform mat4 Modelview;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;


uniform vec3    camera_location;
uniform float   sampling_distance;
uniform float   sampling_distance_ref;
uniform float   iso_value;
uniform vec3    max_bounds;
uniform ivec3   volume_dimensions;

uniform vec3    light_position;
uniform vec3    light_ambient_color;
uniform vec3    light_diffuse_color;
uniform vec3    light_specular_color;
uniform float   light_ref_coef;


bool
inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}

float
get_gradient(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    float p_sample = texture(volume_texture, (in_sampling_pos-1) * obj_to_tex).r; 
    float c_sample = texture(volume_texture, in_sampling_pos * obj_to_tex).r; 

    return (c_sample - p_sample)/2;
}


float
get_sample_data(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(volume_texture, in_sampling_pos * obj_to_tex).r;

}

void main()
{
    /// One step trough the volume
    vec3 ray_increment      = normalize(ray_entry_position - camera_location) * sampling_distance;
    /// Position in Volume
    vec3 sampling_pos       = ray_entry_position + ray_increment; // test, increment just to be sure we are in the volume

    /// Init color of fragment
    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);

    /// check if we are inside volume
    bool inside_volume = inside_volume_bounds(sampling_pos);
    
    if (!inside_volume)
        discard;

if(TASK == 10){
    vec4 max_val = vec4(0.0, 0.0, 0.0, 0.0);
    
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume) 
    {      
        // get sample
        float s = get_sample_data(sampling_pos);
                
        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));
           
        // this is the example for maximum intensity projection
        max_val.r = max(color.r, max_val.r);
        max_val.g = max(color.g, max_val.g);
        max_val.b = max(color.b, max_val.b);
        max_val.a = max(color.a, max_val.a);
        
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }

    dst = max_val;
}
    
if(TASK == 11){
    vec4 avg_val = vec4(0.0, 0.0, 0.0, 0.0);
    int count = 0;
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {      
        // get sample
        float s = get_sample_data(sampling_pos);

        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));

        // dummy code
        avg_val.r = color.r + avg_val.r;
        avg_val.g = color.g + avg_val.g;
        avg_val.b = color.b + avg_val.b;
        avg_val.a = color.a + avg_val.a;
        
        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
        count++;
    }

    avg_val.r = avg_val.r/count;
    avg_val.g = avg_val.g/count;
    avg_val.b = avg_val.b/count;
    avg_val.a = avg_val.a/count;
    dst = avg_val;
}
    
if (TASK == 12 || TASK == 13){

    float previous_val = -1;
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);


        if(s > iso_value) {//we hit some value
            // apply the transfer functions to retrieve color and opacity
            vec4 color = texture(transfer_texture, vec2(s, s));

            //implementing fragment shader
            //vec3 light_direction = (sampling_pos - light_position)
            //float cross_product = dot(light_direction, ray_increment)

            //vec3 diff = light_diffuse_color * max(cross_product, 0)
            //vec3 spec = light_specular_color * max(cross_product,0)

            //dst = color + diff + spec;
            //break;

            dst = color;
            break;
        }

	previous_val = s;
        // increment the ray sampling position
        sampling_pos += ray_increment;
        
        //if TASK == 13 // Binary Search
                //IMPLEMENT;
        //endif
        //if ENABLE_LIGHTNING == 1 // Add Shading
                //IMPLEMENTLIGHT;
        //if ENABLE_SHADOWING == 1 // Add Shadows
                //IMPLEMENTSHADOW;
        //endif
        //endif

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
}

#if TASK == 31
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
#if ENABLE_OPACITY_CORRECTION == 1 // Opacity Correction
        IMPLEMENT;
#else
        float s = get_sample_data(sampling_pos);
#endif
        // dummy code
        dst = vec4(light_specular_color, 1.0);

        // increment the ray sampling position
        sampling_pos += ray_increment;

#if ENABLE_LIGHTNING == 1 // Add Shading
        IMPLEMENT;
#endif

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
#endif 

    // return the calculated color value
    FragColor = dst;
}

