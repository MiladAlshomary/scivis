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
get_sample_data(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(volume_texture, in_sampling_pos * obj_to_tex).r;

}

vec3
get_gradient(vec3 in_sampling_pos)
{

    float x_v = max_bounds.x / volume_dimensions.x;
    float y_v = max_bounds.y / volume_dimensions.y;
    float z_v = max_bounds.z / volume_dimensions.z;

    p2x = vec3(in_sampling_pos.x + x_v,in_sampling_pos.y, in_sampling_pos.z)
    p1x = vec3(in_sampling_pos.x - x_v,in_sampling_pos.y, in_sampling_pos.z)
    
    float p_sample_x = get_sample_data(p2x) - get_sample_data(p1x);

    p2y = vec3(in_sampling_pos.x,in_sampling_pos.y + y_v, in_sampling_pos.z)
    p1y = vec3(in_sampling_pos.x,in_sampling_pos.y - y_v, in_sampling_pos.z)
    
    float p_sample_y = get_sample_data(p2y) - get_sample_data(p1y); 

    p2z = vec3(in_sampling_pos.x,in_sampling_pos.y, in_sampling_pos.z + z_v)
    p1z = vec3(in_sampling_pos.x,in_sampling_pos.y, in_sampling_pos.z - z_v)
    
    float p_sample_z = get_sample_data(p2z) - get_sample_data(p1z); 


    vec3 normal = vec3(p_sample_x/2, p_sample_y/2, p_sample_z/2);


    return normal;
}

vect
binar_search(vec3 n_point, vec3 p_point, float value) {
    //by default assuming that the correct point is the n_point
    vec3 r_point = n_point;

    while(p_point < n_point) {
        //take the middle point
        vec3 mid_point = (p_point + n_point)/2;
        //take the value of middle point
        float s = get_sample_data(mid_point);
        if(s == value){
            return mid_point;
        }

        if(s < value) {
            p_point = mid_point;
        } else {
            n_point = mid_point;
        }
    }

    return n_point;
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
    vec3 first_pos = sampling_pos;
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        if(s > iso_value > previous_val || s < iso_value < previous_val) {

            //Binary Search
    	    if (TASK == 13){
                //new sample point
    	        vec3 new_sample_point = binar_search(sampling_pos,first_pos, iso_value);
                //new sample value
                float s = get_sample_data(new_sample_point);
            }

            //we hit some value
            // apply the transfer functions to retrieve color and opacity
            vec4 color = texture(transfer_texture, vec2(s, s));
            vec4 dest  = color;

            //Add Shading
            if(ENABLE_LIGHTNING == 1) {
                //implementing fragment shader
                vec3 light_direction = normalize(sampling_pos - light_position);
                vec3 normal = normalize(get_gradient(sampling_pos));
                float cross_product = dot(light_direction, normal);
                vec3 diff = light_diffuse_color * max(cross_product, 0);
                vec3 spec = light_specular_color * max(cross_product,0);
                //dst = dest + vec4(diff,1.0) + vec4(spec,1.0);
                dst = vec4(normal/2+0.5, 1.0);
            }
    	    
            //Add Shadows
    	    if(ENABLE_SHADOWING == 1){

            }

            break;

        }

        previous_val = s;
        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
	
	    // increment the ray sampling position
        sampling_pos += ray_increment;
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

