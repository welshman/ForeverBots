use forever_engine::{
    contracts::prepared_v2::PreparedV2, simulate_prepared_gated, EngineIdentity, Gated,
};
use wasm_bindgen::prelude::*;

const MAX_INPUT_BYTES: usize = 2 * 1024 * 1024;
const MAX_ITERATIONS: u64 = 10_000;

fn error(message: impl ToString) -> JsValue {
    JsValue::from_str(&message.to_string())
}

#[wasm_bindgen]
pub fn engine_info_json() -> Result<String, JsValue> {
    serde_json::to_string(&EngineIdentity::current()).map_err(error)
}

#[wasm_bindgen]
pub fn simulate_prepared_json(raw: &str) -> Result<String, JsValue> {
    if raw.len() > MAX_INPUT_BYTES {
        return Err(error("input_too_large: maximum is 2097152 UTF-8 bytes"));
    }
    let value: serde_json::Value = serde_json::from_str(raw).map_err(error)?;
    let iterations = value
        .pointer("/sim/iterations")
        .and_then(serde_json::Value::as_u64)
        .ok_or_else(|| error("invalid_iterations: expected a positive integer"))?;
    if !(1..=MAX_ITERATIONS).contains(&iterations) {
        return Err(error("iteration_limit: allowed range is 1..=10000"));
    }
    let prepared: PreparedV2 = serde_json::from_value(value).map_err(error)?;
    let response = match simulate_prepared_gated(&prepared).map_err(error)? {
        Gated::Refused(refusals) => serde_json::json!({
            "status": "refused",
            "refusals": refusals,
        }),
        Gated::Simulated(report) => serde_json::json!({
            "status": "simulated",
            "report": *report,
        }),
    };
    serde_json::to_string(&response).map_err(error)
}
