import React from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

interface ActionButton {
  label: string;
  action: 'add_criteria' | 'generate_query' | 'refine_audience' | 'clear_audience';
  priority: 'primary' | 'secondary';
}

interface ActionButtonsProps {
  buttons: ActionButton[];
  onButtonClick: (action: ActionButton['action']) => void;
  disabled?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ buttons, onButtonClick, disabled = false }) => {
  const getButtonIcon = (action: ActionButton['action']) => {
    switch (action) {
      case 'add_criteria': return <Plus size={16} />;
      case 'generate_query': return <Search size={16} />;
      case 'refine_audience': return <Edit2 size={16} />;
      case 'clear_audience': return <Trash2 size={16} />;
      default: return null;
    }
  };

  const getButtonClass = (priority: ActionButton['priority']) => {
    return `action-button ${priority === 'primary' ? 'primary' : 'secondary'}`;
  };

  if (buttons.length === 0) return null;

  return (
    <div className="action-buttons-container">
      {buttons.map((button, index) => (
        <button
          key={index}
          onClick={() => onButtonClick(button.action)}
          className={getButtonClass(button.priority)}
          disabled={disabled}
        >
          {getButtonIcon(button.action)}
          <span>{button.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;