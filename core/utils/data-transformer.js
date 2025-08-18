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
        with_card: "Քարտով",
        without_card: "Անքարտ",
        visa: "Visa",
        master: "Master",
        arca: "Arca",
        own_card: "Անձնական քարտ",
        other_card: "Ուրիշի քարտ",
    },
    DEFAULT_DEPOSIT_TYPES : [
        "Անձնական հաշվի համալրում",
        "Կազմակերպության հաշվի համալրում",
        "Մուտքագրում քարտին",
        "Վարկի մարում",
        "Փոխանցում քարտին"
    ],

    // Define which fields to include and their order
    fieldsToInclude: ["deposit_amount", "dispense_amount"],
    encashmentFieldsToInclude: ["added_amount", "collected_amount"],
    inOutFieldsToInclude: ["with_card", "without_card"],
    doughnutFieldsToInclude: ["total_dispense_count", "total_deposit_count"],
    barFieldsToInclude: ["working_percent", "non_working_percent"],
    byMethodFieldsToInclude: ["visa", "master", "arca"],
    ownOtherFieldsToInclude: ["own_card", "other_card"],

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
        console.log('transformed',datasets);
        return {
            metaData: {},
            chartData: {
                labels,
                datasets,
            },
        };
    }

    transformDepositDynamic(depositDynamic) {
        return depositDynamic.map(row => {
            const out = {
                hour: row?.hour ?? 0,
                with_card_count: row?.with_card_count ?? 0,
                with_card_amount: row?.with_card_amount ?? 0,
                without_card_count: row?.without_card_count ?? 0,
                without_card_amount: row?.without_card_amount ?? 0,
            };

            // Seed all default types with zeros
            for (const typeName of this.config.DEFAULT_DEPOSIT_TYPES) {
                out[`${typeName}_amount`] = 0;
                out[`${typeName}_count`] = 0;
            }

            // If deposit_types exist, overwrite the seeded zeros with actual values
            const types = Array.isArray(row?.deposit_types) ? row.deposit_types : [];
            for (const t of types) {
                const name = (t?.deposit_type_name || "").trim();
                if (!name) continue;
                out[`${name}_amount`] = t?.total_amount ?? 0;
                out[`${name}_count`]  = t?.count ?? 0;
            }

            return out;
        });
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
        console.log('extractLabels',dailyData);
        // return dailyData.map((item) => this.formatDate(item.date));
        return dailyData.map((item) => {
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
        const { fieldLabels, encashmentFieldsToInclude, fieldsToInclude, DEFAULT_DEPOSIT_TYPES } = this.config;

        // handle encashment chart and other one
        let fields;
        if (dailyData[0].hasOwnProperty("encashment_count")) {
            fields = encashmentFieldsToInclude;
        } else if(daylyData[0].hasOwnProperty("Անձնական հաշվի համալրում")){
            fields = DEFAULT_DEPOSIT_TYPES;
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
        // console.log("data", data);

        if (!data || typeof data !== "object") {
            throw new Error("Invalid data format: data must be an object");
        }
        const {
            fieldLabels,
            doughnutFieldsToInclude,
            inOutFieldsToInclude,
            byMethodFieldsToInclude,
            ownOtherFieldsToInclude,
        } = this.config;

        let fieldsToInclude;
        if (data.hasOwnProperty("without_card")) {
            fieldsToInclude = inOutFieldsToInclude;
        } else if (data.hasOwnProperty("visa")) {
            fieldsToInclude = byMethodFieldsToInclude;
        } else if (data.hasOwnProperty("own_card")) {
            fieldsToInclude = ownOtherFieldsToInclude;
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
