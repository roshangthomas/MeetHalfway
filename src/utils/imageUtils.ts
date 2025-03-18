// Import default category images
import restaurantImage from '../assets/images/resturant.jpg';
import barImage from '../assets/images/bar.jpg';
import coffeeImage from '../assets/images/coffee.jpg';
import parkImage from '../assets/images/park.jpg';
import shoppingImage from '../assets/images/shopping.jpg';
import moviesImage from '../assets/images/movies.png';

/**
 * Returns a default image based on the place type
 * @param types Array of place types
 * @returns The appropriate default image for the place type
 */
export const getDefaultImageForPlaceType = (types: string[] | undefined) => {
    if (!types || types.length === 0) return restaurantImage;

    // Check for specific place types and return corresponding images
    if (types.some(type => type.includes('restaurant') || type.includes('food'))) {
        return restaurantImage;
    } else if (types.some(type => type.includes('bar') || type.includes('pub'))) {
        return barImage;
    } else if (types.some(type => type.includes('cafe') || type.includes('coffee'))) {
        return coffeeImage;
    } else if (types.some(type => type.includes('park') || type.includes('garden'))) {
        return parkImage;
    } else if (types.some(type => type.includes('shop') || type.includes('store') || type.includes('mall'))) {
        return shoppingImage;
    } else if (types.some(type => type.includes('movie') || type.includes('cinema') || type.includes('theater'))) {
        return moviesImage;
    }

    // Default to restaurant image if no match
    return restaurantImage;
}; 