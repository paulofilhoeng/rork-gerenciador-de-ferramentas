import Foundation
import SwiftUI
import SwiftData

/// Generates and exports CSV reports for tools, rentals, and movements.
enum ReportGenerator {

    // MARK: - CSV Generation

    /// Generates a full tools inventory CSV report. If any tool has attachments,
    /// the CSV is packaged inside a ZIP together with the photos/videos.
    static func generateToolsReport(tools: [Tool]) -> URL? {
        var csv = "Ferramenta;Marca;Modelo;N Serie;Tipo;Status;Obra;Responsavel;Locadora;Custo Diario;Inicio Aluguel;Devolucao;Dias Restantes;Custo Acumulado;Observacoes;Fotos;Videos\n"

        var allAttachments: [ToolAttachment] = []

        for tool in tools.sorted(by: { $0.name < $1.name }) {
            let photos = tool.attachments.filter { $0.type == .photo }.count
            let videos = tool.attachments.filter { $0.type == .video }.count
            let row = [
                tool.name,
                tool.brand,
                tool.model,
                tool.serialNumber,
                tool.ownership.rawValue,
                tool.effectiveStatus.rawValue,
                tool.currentSite?.name ?? "",
                tool.currentEmployee?.name ?? "",
                tool.rentalCompany?.name ?? "",
                tool.ownership == .rented ? String(format: "%.2f", tool.dailyRentalCost) : "",
                tool.rentalStartDate != nil ? formatShortDate(tool.rentalStartDate) : "",
                tool.rentalEndDate != nil ? formatShortDate(tool.rentalEndDate) : "",
                tool.daysRemaining.map { String($0) } ?? "",
                tool.ownership == .rented ? String(format: "%.2f", tool.totalRentalCost) : "",
                tool.notes.replacingOccurrences(of: ";", with: ","),
                String(photos),
                String(videos)
            ]
            csv += row.joined(separator: ";") + "\n"
            allAttachments.append(contentsOf: tool.attachments)
        }

        if allAttachments.isEmpty {
            return saveCSV(csv, filename: "relatorio-ferramentas")
        }

        return packageReport(csv: csv, filename: "relatorio-ferramentas", attachments: allAttachments)
    }

    /// Generates a rental-focused CSV report (only rented tools).
    static func generateRentalReport(tools: [Tool]) -> URL? {
        let rented = tools.filter { $0.ownership == .rented }.sorted { $0.name < $1.name }

        var csv = "Relatorio de Alugueis\n"
        csv += "Gerado em: \(formatShortDate(Date()))\n\n"
        csv += "Ferramenta;Locadora;Obra;Responsavel;Custo Diario;Inicio;Devolucao;Dias Restantes;Custo Acumulado;Status\n"

        var totalCost: Double = 0

        for tool in rented {
            let days = tool.daysRemaining ?? 0
            let statusText: String
            if days < 0 {
                statusText = "Atrasado \(abs(days)) dia(s)"
            } else if days <= 3 {
                statusText = "Vencendo em \(days) dia(s)"
            } else {
                statusText = "No prazo"
            }

            let row = [
                tool.name,
                tool.rentalCompany?.name ?? "—",
                tool.currentSite?.name ?? "—",
                tool.currentEmployee?.name ?? "—",
                String(format: "%.2f", tool.dailyRentalCost),
                formatShortDate(tool.rentalStartDate),
                formatShortDate(tool.rentalEndDate),
                String(days),
                String(format: "%.2f", tool.totalRentalCost),
                statusText
            ]
            csv += row.joined(separator: ";") + "\n"
            totalCost += tool.totalRentalCost
        }

        csv += "\n;Total;;;;;;;\(String(format: "%.2f", totalCost));\n"

        return saveCSV(csv, filename: "relatorio-alugueis")
    }

    /// Generates a movements history CSV report.
    static func generateMovementsReport(movements: [ToolMovement]) -> URL? {
        var csv = "Data;Ferramenta;Tipo;Descricao;Valor Anterior;Novo Valor\n"

        for mov in movements.sorted(by: { $0.timestamp > $1.timestamp }) {
            let row = [
                formatDateTime(mov.timestamp),
                mov.tool?.name ?? "—",
                mov.type.rawValue,
                mov.movementDescription,
                mov.oldValue,
                mov.newValue
            ]
            csv += row.joined(separator: ";") + "\n"
        }

        return saveCSV(csv, filename: "relatorio-movimentacoes")
    }

    // MARK: - Packaging

    private static func packageReport(csv: String, filename: String, attachments: [ToolAttachment]) -> URL? {
        let fm = FileManager.default
        guard let dir = fm.urls(for: .documentDirectory, in: .userDomainMask).first else { return nil }

        let timestamp = ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-")
        let folderName = "\(filename)-\(timestamp)"
        let folderURL = dir.appendingPathComponent(folderName, isDirectory: true)
        let csvURL = folderURL.appendingPathComponent("\(filename).csv")
        let mediaFolderURL = folderURL.appendingPathComponent("midia", isDirectory: true)
        let zipURL = dir.appendingPathComponent("\(folderName).zip")

        do {
            try fm.createDirectory(at: mediaFolderURL, withIntermediateDirectories: true)
            try csv.data(using: .utf8)?.write(to: csvURL, options: .atomic)

            for attachment in attachments {
                guard let sourceURL = attachment.fileURL, fm.fileExists(atPath: sourceURL.path) else { continue }
                let safeName = "\(attachment.tool?.name ?? "ferramenta")-\(attachment.fileName)"
                let destURL = mediaFolderURL.appendingPathComponent(safeName)
                try fm.copyItem(at: sourceURL, to: destURL)
            }

            try folderURL.zip(toFileAt: zipURL)
            try fm.removeItem(at: folderURL)
            return zipURL
        } catch {
            return nil
        }
    }

    // MARK: - Helpers

    private static func saveCSV(_ content: String, filename: String) -> URL? {
        let timestamp = ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-")
        let fullFilename = "\(filename)-\(timestamp).csv"

        guard let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return nil
        }

        let fileURL = dir.appendingPathComponent(fullFilename)

        guard let data = content.data(using: .utf8) else { return nil }

        do {
            try data.write(to: fileURL, options: .atomic)
            return fileURL
        } catch {
            return nil
        }
    }
}
