interface DragHintProps {
  isCollapsed: boolean;
}

export const DragHint = ({ isCollapsed }: DragHintProps) => {
  if (isCollapsed) return null;

  return (
    <div className="pt-4 mt-2 border-t-2 border-dashed border-gray-200/50 dark:border-[#2d2d2d]">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-[#666666]">
          <span>⬇</span>
          <span>Drag nodes to canvas</span>
          <span>⬇</span>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-[#555555] mt-1">Hover for delete option</p>
      </div>
    </div>
  );
};