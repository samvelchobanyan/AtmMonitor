const CHART_CONFIG = {
  // Maps API field names to chart labels
  fieldLabels: {
    // dashboard page
    deposit_amount: "Մուտքագրված գումար",
    dispense_amount: "Կանխիկացված գումար",
    total_dispense_count: "Կանխիկացում",
    total_deposit_count: "Մուտքագրում",
    non_working_percent: "Պարապուրդ",
    working_percent: "Աշխատաժամանակ",
    added_amount: "Ինկասացիայի գումար",
    collected_amount: "Հետ բերված գումար",

    // in/out page
    with_card_amount: "Քարտով",
    without_card_amount: "Անքարտ",
    with_card_count: "Քարտով",
    without_card_count: "Անքարտ",
  },

  // Define which fields to include and their order
  fieldsToInclude: ["deposit_amount", "dispense_amount"],
  encashmentFieldsToInclude: ["added_amount", "collected_amount"],
  inOutCountFieldsToInclude: ["with_card_count", "without_card_count"],
  inOutAmountFieldsToInclude: ["with_card_amount", "without_card_amount"],
  doughnutFieldsToInclude: ["total_dispense_count", "total_deposit_count"],
  barFieldsToInclude: ["working_percent", "non_working_percent"],

  dateFormat: {
    locale: "hy-AM", // Armenian locale
    options: { month: "short", day: "numeric" },
  },
};

class ChartDataTransformer {
  constructor(config = CHART_CONFIG) {
    this.config = config;
  }

  // === LineChart transformation  - default ===
  transformData(daily_data) {
    // const { daily_data } = apiResponse;

    if (!Array.isArray(daily_data)) {
      throw new Error("Invalid data format: daily_data must be an array");
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
      throw new Error("Invalid data format: work_hours_per_day must be an array");
    }

    const { fieldLabels, barFieldsToInclude } = this.config;

    const labels = work_hours_per_day.map((item) => item.date);
    const datasets = barFieldsToInclude.map((field) => {
      return {
        label: fieldLabels[field] || field,
        data: work_hours_per_day.map((item) => item[field] ?? 0),
        backgroundColor: field === "working_percent" ? "#4CAF50" : "#F44336",
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
    // return dailyData.map((item) => this.formatDate(item.date));
    return dailyData.map(item => {
      // Prefer date, fallback hour
      if (item.date) {
        return this.formatDate(item.date);
      } else if (typeof item.hour === "number") {
        // Format hour as string, e.g. "13:00"
        return `${item.hour.toString().padStart(2, "0")}:00`;
      } else if (typeof item.hour === "string") {
        // In case hour is string "13"
        return `${item.hour.padStart(2, "0")}:00`;
      }
      return "";
    });
  }

  extractDatasets(dailyData) {
    const { fieldLabels, encashmentFieldsToInclude, fieldsToInclude } = this.config;

    // handle encashment chart and other one
    let fields;
    if (dailyData[0].hasOwnProperty("encashment_count")) {
      fields = encashmentFieldsToInclude;
    } else {
      fields = fieldsToInclude;
    }

    return fields.map((fieldName) => {
      const label = fieldLabels[fieldName] || fieldName;
      const data = dailyData.map((item) => item[fieldName] || 0);
      return { label, data };
    });
  }

  // === DoughnutChart transformation ===
  transformDoughnutData(apiResponse) {
    const data = apiResponse;

    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format: data must be an object");
    }
    const {
      fieldLabels,
      doughnutFieldsToInclude,
      inOutCountFieldsToInclude,
      inOutAmountFieldsToInclude,
    } = this.config;

    let fieldsToInclude;
    if (data.hasOwnProperty("without_card_count")) {
      fieldsToInclude = inOutCountFieldsToInclude;
    } else if (data.hasOwnProperty("without_card_amount")) {
      fieldsToInclude = inOutAmountFieldsToInclude;
    } else {
      fieldsToInclude = doughnutFieldsToInclude;
    }

    const labels = fieldsToInclude.map((field) => fieldLabels[field] || field);
    const chartData = fieldsToInclude.map((field) => data[field] || 0);

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
  transform(apiResponse, chartType = "line") {
    switch (chartType) {
      case "pie":
        return this.transformDoughnutData(apiResponse);
      case "bar":
        return this.transformBarData(apiResponse);
      case "line":
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
