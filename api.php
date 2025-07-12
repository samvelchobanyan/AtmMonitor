<?php
header('Content-Type: application/json');

$delay = isset($_GET['delay']) ? (int)$_GET['delay'] : 0;

// Clamp delay to max 10 seconds just for safety
$delay = max(0, min($delay, 1));

// Simulate delay
sleep($delay);

$responseLong = [
        "errors" => null,
        "data" => [
            "daily_data" => [
                ["date" => "2025-06-01", "deposit_total" => 60000,   "dispense_total" =>  90000],
                ["date" => "2025-06-02", "deposit_total" => 30000,   "dispense_total" =>  90000],
                ["date" => "2025-06-03", "deposit_total" => 70000,   "dispense_total" =>  40000],
                ["date" => "2025-06-04", "deposit_total" => 70000,   "dispense_total" =>  70000],
                ["date" => "2025-06-05", "deposit_total" => 110000,  "dispense_total" => 100000],
                ["date" => "2025-06-06", "deposit_total" => 90000,   "dispense_total" =>  60000],
                ["date" => "2025-06-07", "deposit_total" => 90000,   "dispense_total" =>  80000],
                ["date" => "2025-06-08", "deposit_total" => 270000,  "dispense_total" => 110000],
                ["date" => "2025-06-09", "deposit_total" => 110000,  "dispense_total" =>  70000],
                ["date" => "2025-06-10", "deposit_total" => 60000,   "dispense_total" => 1662000],
                ["date" => "2025-06-11", "deposit_total" => 3772000, "dispense_total" => 356714000],
                ["date" => "2025-06-12", "deposit_total" => 461000,  "dispense_total" => 8614000],
                ["date" => "2025-06-13", "deposit_total" => 5780000, "dispense_total" => 11287000],
                ["date" => "2025-06-14", "deposit_total" => 150000,  "dispense_total" => 150000],
                ["date" => "2025-06-15", "deposit_total" => 185000,  "dispense_total" => 200000],
                ["date" => "2025-06-16", "deposit_total" => 115000,  "dispense_total" => 256000],
                ["date" => "2025-06-17", "deposit_total" => 175000,  "dispense_total" => 150000],
                ["date" => "2025-06-18", "deposit_total" => 165000,  "dispense_total" => 175000],
                ["date" => "2025-06-19", "deposit_total" => 160000,  "dispense_total" => 36000000],
                ["date" => "2025-06-20", "deposit_total" => 35000,   "dispense_total" =>  25000],
                ["date" => "2025-06-21", "deposit_total" => 30000,   "dispense_total" =>  40000],
                ["date" => "2025-06-22", "deposit_total" => 100000,  "dispense_total" => 110000],
                ["date" => "2025-06-23", "deposit_total" => 220000,  "dispense_total" =>  60000],
                ["date" => "2025-06-24", "deposit_total" => 60000,   "dispense_total" => 120000],
                ["date" => "2025-06-25", "deposit_total" => 30000,   "dispense_total" =>  17000],
                ["date" => "2025-06-26", "deposit_total" => 48000,   "dispense_total" =>  46000],
                ["date" => "2025-06-27", "deposit_total" => 16000,   "dispense_total" =>  66000],
                ["date" => "2025-06-28", "deposit_total" => 160000,  "dispense_total" => 100000],
                ["date" => "2025-06-29", "deposit_total" => 15000,   "dispense_total" =>  80000],
                ["date" => "2025-06-30", "deposit_total" => 27000,   "dispense_total" =>  66000],
                ["date" => "2025-07-01", "deposit_total" => 25000,   "dispense_total" =>  30000],
                ["date" => "2025-07-02", "deposit_total" => 42000,   "dispense_total" =>  22000],
                ["date" => "2025-07-03", "deposit_total" => 46000,   "dispense_total" =>   8000],
                ["date" => "2025-07-04", "deposit_total" => 50000,   "dispense_total" =>  18000],
                ["date" => "2025-07-05", "deposit_total" =>     0,   "dispense_total" =>      0],
                ["date" => "2025-07-06", "deposit_total" =>     0,   "dispense_total" =>      0],
                ["date" => "2025-07-07", "deposit_total" => 80000,   "dispense_total" => 142000],
                ["date" => "2025-07-08", "deposit_total" =>     0,   "dispense_total" =>      0]
            ],
            "total_deposit"          => 12907000,
            "total_dispense"         => 416868000,
            "deposit_percent_change" => 494.79,
            "dispense_percent_change"=> 21223.17
        ],
        "success" => true
    ];
$response = [
    "errors" => null,
    "data" => [
        "daily_data" => [
            [
                "date" => "2025-07-04",
                "deposit_total" => 50000,
                "dispense_total" => 18000
            ],
            [
                "date" => "2025-07-05",
                "deposit_total" => 0,
                "dispense_total" => 0
            ],
            [
                "date" => "2025-07-06",
                "deposit_total" => 0,
                "dispense_total" => 0
            ],
            [
                "date" => "2025-07-07",
                "deposit_total" => 80000,
                "dispense_total" => 142000
            ],
            [
                "date" => "2025-07-08",
                "deposit_total" => 0,
                "dispense_total" => 0
            ],
            [
                "date" => "2025-07-09",
                "deposit_total" => 120000,
                "dispense_total" => 62000
            ],
            [
                "date" => "2025-07-10",
                "deposit_total" => 0,
                "dispense_total" => 0
            ],
            [
                "date" => "2025-07-11",
                "deposit_total" => 0,
                "dispense_total" => 0
            ]
        ],
        "total_deposit" => 250000,
        "total_dispense" => 222000,
        "deposit_percent_change" => -34.04,
        "dispense_percent_change" => -46.89
    ],
    "success" => true
];

echo json_encode($response, JSON_PRETTY_PRINT);
