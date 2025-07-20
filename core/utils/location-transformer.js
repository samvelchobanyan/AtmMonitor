// utils/LocationTransformer.js

const LOCATION_CONFIG = {
    // Define empty value handling
    filterEmpty: true,
    // Define default display for empty values
    emptyValueDisplay: 'Անհայտ'
};

class LocationTransformer {
    constructor(config = LOCATION_CONFIG) {
        this.config = config;
    }

    // Get all provinces as {label, value} options
    getProvinceOptions(data) {
        return data.map(item => ({
            label: item.province,
            value: item.province
        }));
    }

    // Get all cities from all provinces
    getAllCityOptions(data) {
        return data.flatMap(province =>
            province.cities.map(cityObj => ({
                label: cityObj.city || this.config.emptyValueDisplay,
                value: cityObj.city,
                province: province.province
            }))
        ).filter(city => this.config.filterEmpty ? city.value !== "" : true);
    }

    // Get cities from specific province
    getCitiesByProvince(data, provinceName) {
        const province = data.find(p => p.province === provinceName);
        if (!province) return [];

        return province.cities.map(cityObj => ({
            label: cityObj.city || this.config.emptyValueDisplay,
            value: cityObj.city,
            province: province.province
        })).filter(city => this.config.filterEmpty ? city.value !== "" : true);
    }

    // Get all districts from all locations
    getAllDistrictOptions(data) {
        return data.flatMap(province =>
            province.cities.flatMap(city =>
                city.districts.map(district => ({
                    label: district,
                    value: district,
                    city: city.city,
                    province: province.province
                }))
            )
        );
    }

    // Get districts by city
    getDistrictsByCity(data, cityName) {
        for (const province of data) {
            const city = province.cities.find(c => c.city === cityName);
            if (city) {
                return city.districts.map(district => ({
                    label: district,
                    value: district,
                    city: city.city,
                    province: province.province
                }));
            }
        }
        return [];
    }

    // Universal method for any level
    getOptionsByLevel(data, level, parentValue = null) {
        switch(level) {
            case 'provinces':
                return this.getProvinceOptions(data);

            case 'cities':
                return parentValue
                    ? this.getCitiesByProvince(data, parentValue)
                    : this.getAllCityOptions(data);

            case 'districts':
                return parentValue
                    ? this.getDistrictsByCity(data, parentValue)
                    : this.getAllDistrictOptions(data);

            default:
                throw new Error(`Unsupported level: ${level}`);
        }
    }

    // Update configuration
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

// Create singleton instance
const locationTransformer = new LocationTransformer();

// Export both class and instance
export { LocationTransformer, locationTransformer };

// Default export is the singleton instance
export default locationTransformer;