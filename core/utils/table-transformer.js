function transformFaultTableData(apiResponse) {
  if (!apiResponse?.data?.top_faulting_atms) return [];

  return apiResponse.data.top_faulting_atms.map(atm => ({
    atm_and_address: `${atm.atm_id} / ${atm.address}`,
    total_faults: atm.total_faults,
    faults_summary: atm.device_faults
    .map(df => `${df.device_type}(${df.fault_count})`)
    .join(', ')
  }));
}

export default {
  transformFaultTableData
};