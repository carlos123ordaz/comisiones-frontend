// src-tauri/src/lib.rs

use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VentaRecord {
    #[serde(rename = "NroSre")]
    pub nro_sre: String,
    #[serde(rename = "NroDoc")]
    pub nro_doc: String,
    #[serde(rename = "FecMov")]
    pub fec_mov: String,
    #[serde(rename = "CamMda")]
    pub cam_mda: f64,
    #[serde(rename = "Cd_Mda")]
    pub cd_mda: String,
    #[serde(rename = "ValorNeto")]
    pub valor_neto: f64,
    #[serde(rename = "CA10")]
    pub ca10: String,
    #[serde(rename = "Cd_TD")]
    pub cd_td: String,
    #[serde(rename = "DR_NSre")]
    pub dr_nsre: String,
    #[serde(rename = "DR_NDoc")]
    pub dr_ndoc: String,
    #[serde(rename = "IB_Anulado")]
    pub ib_anulado: bool, // ✅ Cambiar de i32 a bool
    #[serde(rename = "Cliente")]
    pub cliente: String,
}

async fn fetch_ventas_from_db() -> Result<Vec<VentaRecord>, String> {
    use tiberius::{AuthMethod, Client, Config};
    use tokio::net::TcpStream;
    use tokio_util::compat::TokioAsyncWriteCompatExt;

    let mut config = Config::new();
    config.host("192.168.10.33");
    config.port(1433);
    config.authentication(AuthMethod::sql_server("SA", "%C0rsus77%"));
    config.database("ERP");
    config.trust_cert();

    let tcp = TcpStream::connect(config.get_addr())
        .await
        .map_err(|e| format!("Error conectando: {}", e))?;

    let mut client = Client::connect(config, tcp.compat_write())
        .await
        .map_err(|e| format!("Error estableciendo conexión: {}", e))?;

    let query = "
        SELECT 
            v.NroSre, 
            v.NroDoc, 
            CONVERT(VARCHAR, v.FecMov, 120) as FecMov,
            CAST(v.CamMda AS FLOAT) as CamMda,
            v.Cd_Mda, 
            CAST(v.ValorNeto AS FLOAT) as ValorNeto,
            v.CA10, 
            v.Cd_TD, 
            ISNULL(v.DR_NSre, '') as DR_NSre,
            ISNULL(v.DR_NDoc, '') as DR_NDoc,
            v.IB_Anulado, 
            ISNULL(v.Cliente, '') as Cliente
        FROM venta v 
        JOIN Cliente2 c ON v.Cd_Clt = c.Cd_Clt 
        WHERE v.FecMov >= '2025-01-01' 
          AND v.ValorNeto IS NOT NULL 
          AND v.IB_Anulado = 0 
          AND c.Cd_TDI != '01'
        ORDER BY v.FecMov ASC
    ";

    let stream = client
        .query(query, &[])
        .await
        .map_err(|e| format!("Error ejecutando query: {}", e))?;

    let rows = stream
        .into_first_result()
        .await
        .map_err(|e| format!("Error procesando resultados: {}", e))?;

    let mut records = Vec::new();

    for row in rows {
        records.push(VentaRecord {
            nro_sre: row.get::<&str, _>(0).unwrap_or("").to_string(),
            nro_doc: row.get::<&str, _>(1).unwrap_or("").to_string(),
            fec_mov: row.get::<&str, _>(2).unwrap_or("").to_string(),
            cam_mda: row.get::<f64, _>(3).unwrap_or(0.0),
            cd_mda: row.get::<&str, _>(4).unwrap_or("").to_string(),
            valor_neto: row.get::<f64, _>(5).unwrap_or(0.0),
            ca10: row.get::<&str, _>(6).unwrap_or("").to_string(),
            cd_td: row.get::<&str, _>(7).unwrap_or("").to_string(),
            dr_nsre: row.get::<&str, _>(8).unwrap_or("").to_string(),
            dr_ndoc: row.get::<&str, _>(9).unwrap_or("").to_string(),
            ib_anulado: row.get::<bool, _>(10).unwrap_or(false), // ✅ Cambiar a bool
            cliente: row.get::<&str, _>(11).unwrap_or("").to_string(),
        });
    }

    Ok(records)
}

#[command]
async fn query_database() -> Result<Vec<VentaRecord>, String> {
    fetch_ventas_from_db().await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![query_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
