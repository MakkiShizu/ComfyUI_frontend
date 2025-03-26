import { LGraph, LGraphNode } from '@comfyorg/litegraph'
import { Subgraph } from '@comfyorg/litegraph/dist/subgraphInterfaces'

import type { PrimitiveNode } from '@/extensions/core/widgetInputs'

export function isPrimitiveNode(
  node: LGraphNode
): node is PrimitiveNode & LGraphNode {
  return node.type === 'PrimitiveNode'
}

/**
 * Check if an error is an AbortError triggered by `AbortController#abort`
 * when cancelling a request.
 */
export const isAbortError = (
  err: unknown
): err is DOMException & { name: 'AbortError' } =>
  err instanceof DOMException && err.name === 'AbortError'

export const isSubgraph = (item: LGraph | Subgraph | null): item is Subgraph =>
  !!item && typeof item === 'object' && 'parent' in item
