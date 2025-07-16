const CHART_CONFIG = {
    // Maps API field names to chart labels
    fieldLabels: {
        'deposit_amount': 'Մուտքագրված գումար',
        'dispense_amount': 'Կանխիկացված գումար',
        'total_dispense_amount': 'Կանխիկացում',
        'total_deposit_amount': 'Մուտքագրում'
    },

    // Define which fields to include and their order
    fieldsToInclude: ['deposit_amount', 'dispense_amount'],
    doughnutFieldsToInclude: ['total_dispense_amount', 'total_deposit_amount'],

    dateFormat: {
        locale: 'hy-AM', // Armenian locale
        options: { month: 'short', day: 'numeric' }
    }
};

class ChartDataTransformer {
    constructor(config = CHART_CONFIG) {
        this.config = config;
    }

    // === LineChart transformation  - default ===
    transformData(apiResponse) {
        const { daily_data } = apiResponse;

        if (!Array.isArray(daily_data)) {
            throw new Error('Invalid data format: daily_data must be an array');
        }

        const labels = this.extractLabels(daily_data);
        const datasets = this.extractDatasets(daily_data);

        return {
            payload: {},
            data: {
                labels,
                datasets
            }
        };
    }

    extractLabels(dailyData) {
        return dailyData.map(item => this.formatDate(item.date));
    }

    extractDatasets(dailyData) {
        const { fieldsToInclude, fieldLabels } = this.config;

        return fieldsToInclude.map(fieldName => {
            const label = fieldLabels[fieldName] || fieldName;
            const data = dailyData.map(item => item[fieldName] || 0);

            return { label, data };
        });
    }

    // === DoughnutChart transformation ===
    transformDoughnutData(apiResponse) {
        const data = apiResponse;

        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format: data must be an object');
        }

        const { fieldLabels, doughnutFieldsToInclude } = this.config;

        const labels = doughnutFieldsToInclude.map(field => fieldLabels[field] || field);
        const chartData = doughnutFieldsToInclude.map(field => data[field] || 0);
        return {
            payload: {
                'total' : 15000000,
                'percent' : 7
            },
            data: {
                labels,
                datasets: [{ data: chartData }]
            }
        };
    }


    //------------------
    transform(apiResponse, chartType = 'line') {
        switch (chartType) {
            case 'pie':
                console.log('transformed data',this.transformDoughnutData(apiResponse));
                return this.transformDoughnutData(apiResponse);
            case 'line':
            default:
                return this.transformData(apiResponse);
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const { locale, options } = this.config.dateFormat;

        return date.toLocaleDateString(locale, options);
    }

}

const chartDataTransformer = new ChartDataTransformer();
export { ChartDataTransformer, chartDataTransformer };

// Default export is the singleton instance
export default chartDataTransformer;