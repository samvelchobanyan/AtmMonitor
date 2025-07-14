const CHART_CONFIG = {
    // Maps API field names to chart labels
    fieldLabels: {
        'deposit_total': 'Մուտքագրված գումար',
        'dispense_total': 'Կանխիկացված գումար'
    },

    // Define which fields to include and their order
    fieldsToInclude: ['dispense_total', 'deposit_total'],

    // Date formatting options
    dateFormat: {
        locale: 'hy-AM', // Armenian locale
        options: { month: 'short', day: 'numeric' }
    }
};

class ChartDataTransformer {
    constructor(config = CHART_CONFIG) {
        this.config = config;
    }

    // Main transformation method
    transformData(apiResponse) {
        const { daily_data } = apiResponse;

        if (!Array.isArray(daily_data)) {
            throw new Error('Invalid data format: daily_data must be an array');
        }

        const labels = this.extractLabels(daily_data);
        const datasets = this.extractDatasets(daily_data);

        return { labels, datasets };
    }

    // Extract and format date labels
    extractLabels(dailyData) {
        return dailyData.map(item => this.formatDate(item.date));
    }

    // Extract datasets based on configuration
    extractDatasets(dailyData) {
        const { fieldsToInclude, fieldLabels } = this.config;

        return fieldsToInclude.map(fieldName => {
            const label = fieldLabels[fieldName] || fieldName;
            const data = dailyData.map(item => item[fieldName] || 0);

            return { label, data };
        });
    }

    // Format date according to configuration
    formatDate(dateString) {
        const date = new Date(dateString);
        const { locale, options } = this.config.dateFormat;

        return date.toLocaleDateString(locale, options);
    }

    // Update configuration dynamically
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

const chartDataTransformer = new ChartDataTransformer();
export { ChartDataTransformer, chartDataTransformer };

// Default export is the singleton instance
export default chartDataTransformer;