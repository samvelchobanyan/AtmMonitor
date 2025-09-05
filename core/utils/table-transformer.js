function transformFaultTableData(apiResponse) {
    // if (!apiResponse?.data?.top_faulting_atms) return [];
    if (apiResponse.data.top_faulting_atms) {
        return apiResponse.data.top_faulting_atms.map((atm) => ({
            atm_and_address: `${atm.atm_id} / ${atm.address}`,
            total_faults: atm.total_faults,
            faults_summary: atm.device_faults
                .map((df) => `${df.device_type}(${df.fault_count})`)
                .join(", "),
        }));
    } else if (apiResponse.data.encashments) {
        return apiResponse.data.encashments.map((item) => ({
            date_time: item.date_time,
            atm_address: `${item.atm_id} / ${item.address}`,
            added_amount: item.added_amount,
            collected_amount: item.collected_amount,
            marked_as_empty: item.marked_as_empty,
        }));
    }else if (apiResponse.data.events) {
        return apiResponse.data.events.map((item) => ({
            date: item.date,
            server_date: item.server_date,
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
