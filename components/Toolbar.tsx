import React from 'react';
import { ModelType, TaskType } from '../types';
import { 
  Wand2, 
  Bug, 
  FileCode2, 
  Zap, 
  ArrowRightLeft, 
  Cpu
} from 'lucide-react';

interface ToolbarProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  onRunTask: (task: TaskType) => void;
  isProcessing: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ 
  selectedModel, 
  onModelChange, 
  onRunTask,
  isProcessing 
}) => {
  
  const tasks = [
    { type: TaskType.CONVERT_PHP_TO_REACT, label: "Migrate PHP → React", icon: <ArrowRightLeft className="w-4 h-4" /> },
    { type: TaskType.GENERATE_SYSTEM, label: "Generate from Spec", icon: <Wand2 className="w-4 h-4" /> },
    { type: TaskType.DEBUG_FIX, label: "Debug & Fix", icon: <Bug className="w-4 h-4" /> },
    { type: TaskType.EXPLAIN_CODE, label: "Explain", icon: <FileCode2 className="w-4 h-4" /> },
    { type: TaskType.OPTIMIZE, label: "Optimize", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="border-b border-slate-800 bg-slate-900 p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20 shadow-xl">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <Cpu className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          DevMigrate <span className="text-indigo-400 font-light">Studio</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
        <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
          <button
            onClick={() => onModelChange(ModelType.FLASH)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              selectedModel === ModelType.FLASH 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3 h-3" />
            Flash (Fast)
          </button>
          <button
            onClick={() => onModelChange(ModelType.PRO)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              selectedModel === ModelType.PRO 
                ? 'bg-purple-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Wand2 className="w-3 h-3" />
            Pro (Reasoning)
          </button>
        </div>
      </div>

      <div className="hidden md:flex h-6 w-px bg-slate-700 mx-2"></div>

      <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
        {tasks.map((task) => (
          <button
            key={task.type}
            onClick={() => onRunTask(task.type)}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
          >
            {task.icon}
            {task.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Toolbar;
