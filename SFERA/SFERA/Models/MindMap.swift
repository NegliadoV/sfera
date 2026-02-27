//
//  MindMap.swift
//  SFERA
//

import Foundation

struct MindMapItem: Identifiable, Codable {
    let id: String
    let title: String?
    var name: String? { title }
}
