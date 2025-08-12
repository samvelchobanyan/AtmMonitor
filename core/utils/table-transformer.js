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
