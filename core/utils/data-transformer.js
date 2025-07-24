const CHART_CONFIG = {
  // Maps API field names to chart labels
  fieldLabels: {
    deposit_amount: 'Մուտքագրված գումար',
    dispense_amount: 'Կանխիկացված գումար',
    total_dispense_count: 'Կանխիկացում',
    total_deposit_count: 'Մուտքագրում',
    non_working_percent: 'Պարապուրդ',
    working_percent: 'Աշխատաժամանակ',
  },

  // Define which fields to include and their order
  fieldsToInclude: ['deposit_amount', 'dispense_amount'],
  doughnutFieldsToInclude: ['total_dispense_count', 'total_deposit_count'],
  barFieldsToInclude: ['working_percent', 'non_working_percent'],

  dateFormat: {
    locale: 'hy-AM', // Armenian locale
    options: { month: 'short', day: 'numeric' },
  },
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
      metaData: {},
      chartData: {
        labels,
        datasets,
      },
    };
  }

  // === BarChart transformation ===
  transformBarData(apiResponse) {
    const { work_hours_per_day } = apiResponse;

    if (!Array.isArray(work_hours_per_day)) {
      throw new Error('Invalid data format: work_hours_per_day must be an array');
    }

    const { fieldLabels, barFieldsToInclude } = this.config;

    const labels = work_hours_per_day.map((item) => item.date);
    const datasets = barFieldsToInclude.map((field) => {
      return {
        label: fieldLabels[field] || field,
        data: work_hours_per_day.map((item) => item[field] ?? 0),
        backgroundColor: field === 'working_percent' ? '#4CAF50' : '#F44336',
      };
    });

    return {
      metaData: {},
      chartData: {
        labels,
        datasets,
      },
    };
  }

  extractLabels(dailyData) {
    return dailyData.map((item) => this.formatDate(item.date));
  }

  extractDatasets(dailyData) {
    const { fieldsToInclude, fieldLabels } = this.config;

    return fieldsToInclude.map((fieldName) => {
      const label = fieldLabels[fieldName] || fieldName;
      const data = dailyData.map((item) => item[fieldName] || 0);

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

    const labels = doughnutFieldsToInclude.map((field) => fieldLabels[field] || field);
    const chartData = doughnutFieldsToInclude.map((field) => data[field] || 0);

    return {
      metaData: {
        total: data.total_deposit_amount + data.total_dispense_amount,
        // total: 379852,
        percent: 7,
      },
      chartData: {
        labels,
        datasets: [{ data: chartData }],
      },
    };
  }

  //------------------
  transform(apiResponse, chartType = 'line') {
    switch (chartType) {
      case 'pie':
        return this.transformDoughnutData(apiResponse);
      case 'bar':
        return this.transformBarData(apiResponse);
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
