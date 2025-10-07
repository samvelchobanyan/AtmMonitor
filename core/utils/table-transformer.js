import formatDate from "./date-transformer.js";

function transformFaultTableData(apiResponse) {
    console.log("table transformer ===>", apiResponse);

    // Journal data structure
    if (apiResponse.data?.events) {
        return apiResponse.data.events.map((event) => ({
            date: new Date(event.date).toLocaleString(),
            server_date: new Date(event.server_date).toLocaleString(),
            code: event.code || "-",
            card_number: event.card_number,
            event_description: event.event_description,
            atm_id: event.atm_id,
            transaction_id: event.transaction_id,
        }));
    }
    // Failures data structure
    else if (apiResponse?.top_faulting_atms) {
        return apiResponse.top_faulting_atms.map((data) => ({
            atm_and_address: `${data.atm_id} / ${data.address}`,
            total_faults_count: data.total_faults,
            faults_summary: data.device_faults
                .map((df) => `${df.device_type}(${df.fault_count})`)
                .join(", "),
        }));
    } else if (apiResponse?.faults_by_device_type) {
        return apiResponse.faults_by_device_type.map((data) => ({
            atm_and_address: `${data.atm_id} / ${data.address}`,
            total_faults: data.error_count,
            faults_duration: data.duration,
        }));
    }
    // Encashment data structure
    else if (apiResponse.data?.encashments) {
        return apiResponse.data.encashments.map((item) => ({
            date_time: formatDate(item.date_time),
            atm_address: `${item.atm_id} / ${item.atm_address}`,
            added_amount: item.added_amount,
            collected_amount: item.collected_amount,
            marked_as_empty: item.marked_as_empty,
        }));
    }
    // Notifications data
    else if (apiResponse?.device_errors) {
        return apiResponse.device_errors.map((item) => ({
            atm_id: item.atm_id,
            date: formatDate(item.created_at),
            address: `${item.city}, ${item.address}`,
            fault_type: item.device_name,
            message: item.message,
        }));
    } else if (apiResponse?.taken_cards) {
        return apiResponse.taken_cards.map((item) => ({
            atm_id: item.atm_id,
            date: formatDate(item.created_at),
            address: `${item.city}, ${item.address}`,
            card_number: item.card_number,
        }));
    } else if (apiResponse?.problematic_transactions) {
        return apiResponse.problematic_transactions.map((item) => ({
            atm_id: item.atm_id,
            date: formatDate(item.created_at),
            address: `${item.city}, ${item.address}`,
            amount: item.amount,
            transaction_id: item.transaction_id,
            message: item.message,
        }));
    }
    // Journal data
    else if (apiResponse.data?.events) {
        return apiResponse.data.events.map((item) => ({
            date: formatDate(item.date),
            server_date: formatDate(item.server_date),
            code: item.code,
            card_number: item.card_number,
            event_description: item.event_description,
            atm_id: item.atm_id,
            transaction_id: item.transaction_id,
        }));
    } else if (Array.isArray(apiResponse.data)) {
        return apiResponse.data.map((item) => ({
            province: item.province,
            exchange_usd_amount: item.exchange_usd_amount,
            exchange_rub_amount: item.exchange_rub_amount,
            exchange_eur_amount: item.exchange_eur_amount,
            dispense_count: item.dispense_count,
            dispense_amount: item.dispense_amount,
            deposit_count: item.deposit_count,
            deposit_amount: item.deposit_amount,
        }));
    }
}

export default {
    transformFaultTableData,
};
