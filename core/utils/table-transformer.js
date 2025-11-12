import { formatDate, formatCompactDate } from './date-transformer.js';

function transformFaultTableData(apiResponse) {
  console.log('table transformer ===>', apiResponse);

  // Journal data structure
  if (apiResponse.data?.events) {
    return apiResponse.data.events.map((event) => ({
      date: formatCompactDate(event.date),
      server_date: formatCompactDate(event.server_date),
      code: event.code || '-',
      card_number: event.card_number,
      event_description: event.event_description,
      atm_id: event.atm_name,
      transaction_id: event.transaction_id,
    }));
  }
  // Failures data structure
  else if (
    Array.isArray(apiResponse?.data) &&
    apiResponse.data[0]?.total_faults
  ) {
    return apiResponse.data?.map((data) => ({
      atm_id: data.atm_name,
      address: data.address,
      total_faults: data.total_faults,
      faults_summary: data.device_faults
        .map((df) => `${df.device_type}(${df.fault_count})`)
        .join(', '),
    }));
  } else if (Array.isArray(apiResponse?.data) && apiResponse.data[0]?.atms) {
    const allAtms = apiResponse.data.flatMap((device) =>
      device.atms.map((atm) => ({
        device_type: device.device_type,
        device_type_id: device.device_type_id,
        ...atm,
      }))
    );

    return allAtms.map((data) => ({
      atm_id: data.atm_name,
      address: data.address,
      total_faults: data.error_count,
      faults_duration: data.duration,
    }));
  } 
  // Repair summary data structure
  else if (
    Array.isArray(apiResponse?.data) &&
    (apiResponse.data[0]?.error_date || apiResponse.data[0]?.fixed_at)
  ) {
    return apiResponse.data.map((item) => ({
      atm_name: item.atm_name,
      error_date: formatCompactDate(item.error_date),
      mail_sent_at: item.mail_sent_at ? formatCompactDate(item.mail_sent_at) : '',
      fixed_at: formatCompactDate(item.fixed_at),
      actual_repair_hours: item.actual_repair_hours,
      repair_time: item.repair_time,
      device_type: item.device_type,
      description: item.description || '',
    }));
  }
  // Encashment data structure
  else if (apiResponse.data?.encashments) {
    return apiResponse.data.encashments.map((item) => ({
      atm_id: item.atm_name,
      date_time: formatCompactDate(item.date_time),
      atm_address: `${item.city}/${item.atm_address}`,
      added_amount: item.added_amount,
      collected_amount: item.collected_amount,
      marked_as_empty: item.marked_as_empty,
    }));
  }
  // Notifications data
  else if (apiResponse?.device_errors) {
    return apiResponse.device_errors.map((item) => ({
      atm_id: item.atm_id, //for link
      date: formatCompactDate(item.created_at),
      address: `${item.city}, ${item.address}`,
      fault_type: item.device_name,
      message: item.message,
    }));
  } else if (apiResponse?.taken_cards) {
    return apiResponse.taken_cards.map((item) => ({
      atm_id: item.atm_name,
      date: formatCompactDate(item.created_at),
      address: `${item.city}, ${item.address}`,
      card_number: item.card_number,
    }));
  } else if (apiResponse?.problematic_transactions) {
    return apiResponse.problematic_transactions.map((item) => ({
      atm_id: item.atm_name,
      date: formatCompactDate(item.created_at),
      address: `${item.city}, ${item.address}`,
      amount: item.amount,
      transaction_id: item.transaction_id,
      message: item.message,
    }));
    // }
    // Journal data
    // else if (apiResponse.data?.events) {
    //   return apiResponse.data.events.map((item) => ({
    //     date: formatCompactDate(item.date),
    //     server_date: formatCompactDate(item.server_date),
    //     code: item.code,
    //     card_number: item.card_number,
    //     event_description: item.event_description,
    //     atm_name: item.atm_name,
    //     transaction_id: item.transaction_id,
    //   }));
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
