function transformFaultTableData(apiResponse) {
    // Journal data structure
    if (apiResponse.data?.events) {
        return apiResponse.data.events.map((event) => ({
            date: new Date(event.date).toLocaleString(),
            server_date: new Date(event.server_date).toLocaleString(),
            code: event.code || '-',
            card_number: event.card_number,
            event_description: event.event_description,
            atm_id: event.atm_id,
            transaction_id: event.transaction_id
        }));
    }
    // Fault data structure
    else if (apiResponse.data.top_faulting_atms) {
        return apiResponse.data.top_faulting_atms.map((atm) => ({
            atm_and_address: `${atm.atm_id} / ${atm.address}`,
            total_faults: atm.total_faults,
            faults_summary: atm.device_faults
            .map((df) => `${df.device_type}(${df.fault_count})`)
            .join(", "),
        }));
    }
    // Encashment data structure
    else if (apiResponse.data.encashments) {
        return apiResponse.data.encashments.map((item) => ({
            date_time: item.date_time,
            atm_address: `${item.atm_id} / ${item.address}`,
            added_amount: item.added_amount,
            collected_amount: item.collected_amount,
            marked_as_empty: item.marked_as_empty,
        }));
    }
    // Array data structure
    else if (Array.isArray(apiResponse.data)) {
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
