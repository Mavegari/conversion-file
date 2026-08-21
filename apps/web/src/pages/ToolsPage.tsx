import { useNavigate } from 'react-router-dom';
import { CONVERSION_TOOLS } from '../types/conversion';

export default function ToolsPage() {
  const navigate = useNavigate();

  const handleToolClick = (apiType: string) => {
    navigate(`/converter/${apiType}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">File Conversion Tools</h1>
          <p className="text-gray-400">
            Convert any file format instantly. Choose a tool to get started.
          </p>
        </div>
      </header>

      {/* Tools Grid */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CONVERSION_TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.apiType)}
              className="group bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 hover:bg-gray-750 transition-all duration-300 cursor-pointer text-left"
            >
              {/* Icon */}
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2">{tool.name}</h3>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-4">{tool.description}</p>

              {/* Input/Output Formats */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Input</span>
                  <div className="flex flex-wrap gap-1">
                    {tool.inputFormats.map((fmt) => (
                      <span
                        key={fmt}
                        className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase tracking-wide">Output</span>
                  <div className="flex flex-wrap gap-1">
                    {tool.outputFormats.map((fmt) => (
                      <span
                        key={fmt}
                        className="text-xs bg-red-900 bg-opacity-30 text-red-300 px-2 py-1 rounded"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-red-500 font-semibold text-sm group-hover:text-red-400">
                Start Converting →
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
