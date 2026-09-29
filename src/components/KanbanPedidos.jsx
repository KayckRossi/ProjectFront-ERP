import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Clock, ChefHat, CheckCircle2, Package } from 'lucide-react';
import { pedidos as pedidosIniciais } from '@/lib/mockData';
import { formatCurrency, formatDateTime, initials } from '@/lib/format';

const COLUNAS = [
  { id: 'pendente', label: 'Pendente', icon: Clock, dot: 'bg-warning', ring: 'ring-warning/30' },
  { id: 'em_preparo', label: 'Em Preparo', icon: ChefHat, dot: 'bg-pearl', ring: 'ring-pearl/30' },
  { id: 'finalizado', label: 'Finalizado', icon: CheckCircle2, dot: 'bg-verdigris', ring: 'ring-verdigris/30' },
];

export default function KanbanPedidos() {
  const [pedidos, setPedidos] = useState(pedidosIniciais || []);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;
    setPedidos(prev => prev.map(o => o.id === draggableId ? { ...o, status: destination.droppableId } : o));
  };

  const mover = (id, dir) => {
    const pedido = COLUNAS.findIndex(c => c.id === pedidos.find(o => o.id === id)?.status);
    const next = pedido + dir;
    if (next < 0 || next >= COLUNAS.length) return;
    setPedidos(prev => prev.map(o => o.id === id ? { ...o, status: COLUNAS[next].id } : o));
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {COLUNAS.map(col => {
          const Icon = col.icon;
          const itens = pedidos.filter(o => o.status === col.id);
          return (
            <div key={col.id} className="flex flex-col bg-graphite rounded-card card-shadow min-h-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(125,226,209,0.10)]">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <Icon size={16} className="text-snow/70" />
                  <h3 className="text-sm font-semibold text-snow">{col.label}</h3>
                </div>
                <span className="text-xs text-snow/50 bg-onyx px-2 py-0.5 rounded-full">{itens.length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-3 space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-verdigris-light' : ''}`}
                  >
                    {itens.map((o, idx) => {
                      const colIdx = COLUNAS.findIndex(c => c.id === col.id);
                      const nomeCliente = o.cliente || o.customer;
                      const qtdItens = o.itens ?? o.items;
                      const formaPagamento = o.pagamento || o.payment;
                      const dataPedido = o.data || o.date;

                      return (
                        <Draggable key={o.id} draggableId={o.id} index={idx}>
                          {(prov, snap) => (
                            <motion.div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: snap.isDragging ? 0.9 : 1, y: 0 }}
                              className={`bg-onyx rounded-lg p-3.5 ring-1 ${col.ring} ${snap.isDragging ? 'shadow-2xl shadow-black/40 cursor-grabbing' : 'cursor-grab hover:ring-pearl/40'} transition-all`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-verdigris flex items-center justify-center text-snow font-semibold text-xs shrink-0">
                                  {initials(nomeCliente)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-snow truncate">{nomeCliente}</p>
                                  <p className="text-xs text-snow/40 mt-0.5">#{o.id.replace('ped-', '')}</p>
                                </div>
                                <span className="text-sm font-semibold text-pearl whitespace-nowrap">{formatCurrency(o.total)}</span>
                              </div>

                              <div className="flex items-center gap-3 mt-3 text-xs text-snow/50">
                                <span className="flex items-center gap-1"><Package size={12} /> {qtdItens} itens</span>
                                <span>·</span>
                                <span>{formaPagamento}</span>
                                <span>·</span>
                                <span>{formatDateTime(dataPedido)}</span>
                              </div>

                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => mover(o.id, -1)}
                                  disabled={colIdx === 0}
                                  className="flex-1 h-8 rounded-md bg-graphite-hover text-snow/70 text-xs font-medium hover:bg-verdigris hover:text-snow transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  ←
                                </button>
                                <button
                                  onClick={() => mover(o.id, 1)}
                                  disabled={colIdx === COLUNAS.length - 1}
                                  className="flex-1 h-8 rounded-md bg-graphite-hover text-snow/70 text-xs font-medium hover:bg-verdigris hover:text-snow transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {itens.length === 0 && (
                      <div className="text-center py-10 text-snow/30 text-xs">
                        Arraste pedidos para esta coluna
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
