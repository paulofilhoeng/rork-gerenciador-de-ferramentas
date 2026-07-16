import Foundation

extension URL {
    /// Creates a zip archive of the file or directory at this URL and writes it to the destination URL.
    func zip(toFileAt dest: URL) throws {
        let fm = FileManager.default
        var isDir: ObjCBool = false

        let srcDir: URL
        let srcDirIsTemporary: Bool
        if self.isFileURL && fm.fileExists(atPath: path, isDirectory: &isDir) && isDir.boolValue {
            srcDir = self
            srcDirIsTemporary = false
        } else {
            srcDir = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString)
            try fm.createDirectory(at: srcDir, withIntermediateDirectories: true)
            let tmpURL = srcDir.appendingPathComponent(self.lastPathComponent)
            try fm.copyItem(at: self, to: tmpURL)
            srcDirIsTemporary = true
        }

        let coord = NSFileCoordinator()
        var readError: NSError?
        var copyError: NSError?
        var errorToThrow: NSError?
        var readSucceeded = false
        var tmpZipURL: URL?

        coord.coordinate(
            readingItemAt: srcDir,
            options: .forUploading,
            error: &readError
        ) { zippedURL in
            readSucceeded = true
            do {
                if fm.fileExists(atPath: dest.path) {
                    try fm.removeItem(at: dest)
                }
                try fm.copyItem(at: zippedURL, to: dest)
                tmpZipURL = zippedURL
            } catch {
                copyError = error as NSError
            }
        }

        if srcDirIsTemporary {
            try? fm.removeItem(at: srcDir)
        }

        if let error = readError ?? copyError ?? errorToThrow {
            throw error
        }
        if !readSucceeded {
            throw NSError(domain: "ZIPHelper", code: 1, userInfo: [NSLocalizedDescriptionKey: "Falha ao criar arquivo ZIP."])
        }
        _ = tmpZipURL
    }
}
