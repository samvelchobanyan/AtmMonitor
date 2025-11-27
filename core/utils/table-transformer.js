import { formatDate, formatCompactDate } from "./date-transformer.js";

// === Individual Transformers ===

function transformJournalData(apiResponse) {
    if (!apiResponse.data?.events) return [];
    return apiResponse.data.events.map((event) => ({
        date: formatCompactDate(event.date),
        server_date: formatCompactDate(event.server_date),
        code: event.code || "-",
        card_number: event.card_number,
        event_description: event.event_description,
        atm_id: event.atm_name,
        transaction_id: event.transaction_id,
    }));
}

function transformFailuresData(apiResponse) {
    if (!Array.isArray(apiResponse?.data) || !apiResponse.data[0]?.total_faults) return [];
    return apiResponse.data.map((data) => ({
        atm_id: data.atm_name,
        address: data.address,
        total_faults: data.total_faults,
        faults_summary: data.device_faults
            .map((df) => `${df.device_type}(${df.fault_count})`)
            .join(", "),
    }));
}

function transformDeviceFaultsData(apiResponse) {
    if (!Array.isArray(apiResponse?.data) || !apiResponse.data[0]?.atms) return [];
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

function transformRepairsData(apiResponse) {
    if (!Array.isArray(apiResponse?.data?.repairs)) return [];
    return apiResponse.data.repairs.map((item) => ({
        atm_name: item.atm_name,
        error_date: item.error_date ? formatCompactDate(item.error_date) : '',
        mail_sent_at: item.mail_sent_at ? formatCompactDate(item.mail_sent_at) : '',
        fixed_at: item.fixed_at ? formatCompactDate(item.fixed_at) : '',
        actual_repair_hours: item.actual_repair_hours,
        repair_time: item.repair_time,
        device_type: item.device_type,
        description: item.description || '',
        is_late: item.is_late,
    }));
}

function transformEncashmentsData(apiResponse) {
    if (!apiResponse.data?.encashments) return [];
    return apiResponse.data.encashments.map((item) => ({
        atm_id: item.atm_name,
        date_time: formatCompactDate(item.date_time),
        atm_address: `${item.city}/${item.atm_address}`,
        added_amount: item.added_amount,
        collected_amount: item.collected_amount,
        marked_as_empty: formatCompactDate(item.marked_as_empty),
        limit_exceeded: item.limit_exceeded,
    }));
}

function transformNotificationsData(apiResponse) {
    if (!apiResponse?.device_errors) return [];
    return apiResponse.device_errors.map((item) => ({
        atm_id: item.atm_id,
        date: formatCompactDate(item.created_at),
        address: `${item.city}, ${item.address}`,
        fault_type: item.device_name,
        message: item.message,
        notification_id: item.notification_id,
        mail_sent_at: item.mail_sent_at ? formatCompactDate(item.mail_sent_at) : "",
    }));
}

function transformTakenCardsData(apiResponse) {
    if (!apiResponse?.taken_cards) return [];
    return apiResponse.taken_cards.map((item) => ({
        atm_id: item.atm_name,
        date: formatCompactDate(item.created_at),
        address: `${item.city}, ${item.address}`,
        card_number: item.card_number,
    }));
}

function transformProblematicTransactionsData(apiResponse) {
    if (!apiResponse?.problematic_transactions) return [];
    return apiResponse.problematic_transactions.map((item) => ({
        atm_id: item.atm_name,
        date: formatCompactDate(item.created_at),
        address: `${item.city}, ${item.address}`,
        amount: item.amount,
        transaction_id: item.transaction_id,
        message: item.message,
    }));
}

function transformBalanceData(apiResponse) {
    if (!apiResponse?.data?.date || !Array.isArray(apiResponse?.data?.atms)) return [];
    const formattedDate = formatCompactDate(apiResponse.data.date);

    return apiResponse.data.atms.map((atm) => {
        const currencyMap = { AMD: 0, USD: 0, EUR: 0, RUB: 0 };

        if (Array.isArray(atm.totals)) {
            atm.totals.forEach((t) => {
                if (currencyMap.hasOwnProperty(t.currency)) {
                    currencyMap[t.currency] = t.amount;
                }
            });
        }

        return {
            atm_id: atm.atm_name,
            date: formattedDate,
            atm_address: atm.atm_address,
            balance_amd: currencyMap.AMD,
            balance_usd: currencyMap.USD,
            balance_eur: currencyMap.EUR,
            balance_rub: currencyMap.RUB,
        };
    });
}

function transformCumulativeData(apiResponse) {
    if (!Array.isArray(apiResponse.data)) return [];
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

// === URL Detection & Routing ===

function transformTableData(apiResponse, url = '') {
    const lower = url.toLowerCase();

    // Journal events
    if (lower.includes('/journal') || lower.includes('events-journal')) {
        return transformJournalData(apiResponse);
    }

    // Encashments
    if (lower.includes('/encashment')) {
        return transformEncashmentsData(apiResponse);
    }

    // Repairs
    if (lower.includes('/repairs')) {
        return transformRepairsData(apiResponse);
    }

    // Notifications & device errors
    if (lower.includes('device-errors')) {
        return transformNotificationsData(apiResponse);
    }

    // Taken cards
    if (lower.includes('taken-cards')) {
        return transformTakenCardsData(apiResponse);
    }

    // Problematic transactions
    if (lower.includes('problematic-transactions')) {
        return transformProblematicTransactionsData(apiResponse);
    }

    // Balance data
    if (lower.includes('balance')) {
        return transformBalanceData(apiResponse);
    }

    // Cumulative/analytics
    if (lower.includes('/cumulative') || lower.includes('cumulative-summary')) {
        return transformCumulativeData(apiResponse);
    }

    // ATM failures - check for device faults structure first
    if (lower.includes('/atm-failures') || lower.includes('/failures')) {
        // Try device faults structure first
        if (Array.isArray(apiResponse?.data) && apiResponse.data[0]?.atms) {
            return transformDeviceFaultsData(apiResponse);
        }
        // Fall back to regular failures
        return transformFailuresData(apiResponse);
    }

    console.warn('Unknown URL pattern, returning empty array', url);
    return [];
}

export default {
    transformTableData,
    // Backward compatibility alias
    transformFaultTableData: transformTableData,
};
