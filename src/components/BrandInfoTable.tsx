interface BrandInfoTableProps {
  user: User;
  categoryId: string;
  categoryName: string;
  creatorName: string;
  onDeleteCategory: () => void;
}

interface BrandInfo {
  id: string;
  category_id: string;
  brand_name: string;
  brand_theme: string;
  special_feature: string;
  projects: { [key: string]: string }; // プロジェクト名とその値
  user_id: string;
  created_at: string;
}

function BrandInfoTable({ user, categoryId, categoryName, creatorName, onDeleteCategory }: BrandInfoTableProps) {
  const [brandInfos, setBrandInfos] = useState<BrandInfo[]>([]);
  const [projectColumns, setProjectColumns] = useState<string[]>([]);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [editingCell, setEditingCell] = useState<{ brandId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadBrandInfos();
  }, [categoryId]);

  const loadBrandInfos = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_infos')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setBrandInfos(data || []);

      // すべてのプロジェクト列を収集
      const allProjects = new Set<string>();
      (data || []).forEach(info => {
        Object.keys(info.projects || {}).forEach(proj => allProjects.add(proj));
      });
      setProjectColumns(Array.from(allProjects));
    } catch (error) {
      console.error('ブランド情報読み込みエラー:', error);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;

    try {
      const { error } = await supabase
        .from('brand_infos')
        .insert({
          category_id: categoryId,
          brand_name: newBrandName,
          brand_theme: '',
          special_feature: '',
          projects: {},
          user_id: user.id,
        });

      if (error) throw error;

      setNewBrandName('');
      setShowAddBrand(false);
      loadBrandInfos();
    } catch (error) {
      console.error('ブランド追加エラー:', error);
      alert('ブランドの追加に失敗しました');
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) return;

    setProjectColumns([...projectColumns, newProjectName]);
    setNewProjectName('');
    setShowAddProject(false);
  };

  const handleUpdateCell = async (brandId: string, field: string, value: string) => {
    try {
      const brand = brandInfos.find(b => b.id === brandId);
      if (!brand) return;

      let updateData: any = {};

      if (field === 'brand_theme' || field === 'special_feature') {
        updateData[field] = value;
      } else {
        // プロジェクト列の場合
        updateData.projects = { ...brand.projects, [field]: value };
      }

      const { error } = await supabase
        .from('brand_infos')
        .update(updateData)
        .eq('id', brandId);

      if (error) throw error;

      loadBrandInfos();
    } catch (error) {
      console.error('更新エラー:', error);
      alert('更新に失敗しました');
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('このブランドを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('brand_infos')
        .delete()
        .eq('id', brandId);

      if (error) throw error;

      loadBrandInfos();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const handleDeleteProject = (projectName: string) => {
    if (!confirm(`プロジェクト列「${projectName}」を削除しますか？`)) return;

    setProjectColumns(projectColumns.filter(p => p !== projectName));

    // すべてのブランドからこのプロジェクトを削除
    brandInfos.forEach(brand => {
      if (brand.projects && brand.projects[projectName]) {
        const newProjects = { ...brand.projects };
        delete newProjects[projectName];

        supabase
          .from('brand_infos')
          .update({ projects: newProjects })
          .eq('id', brand.id)
          .then(() => loadBrandInfos());
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {creatorName} - {categoryName}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">ブランド情報管理</p>
        </div>
        <button
          onClick={onDeleteCategory}
          className="px-4 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
        >
          品目を削除
        </button>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 min-w-[150px]">
                  ブランド名
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 min-w-[200px]">
                  ブランドテーマ
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 min-w-[200px]">
                  特化した特徴
                </th>
                {projectColumns.map(project => (
                  <th key={project} className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 min-w-[150px] group">
                    <div className="flex items-center justify-between">
                      <span>{project}</span>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 transition-all"
                        title="列を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-900 w-[100px]">
                  {showAddProject ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="プロジェクト名"
                        className="px-2 py-1 text-sm border border-neutral-300 rounded"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddProject();
                          if (e.key === 'Escape') {
                            setShowAddProject(false);
                            setNewProjectName('');
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleAddProject}
                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setShowAddProject(false);
                          setNewProjectName('');
                        }}
                        className="p-1 text-neutral-400 hover:bg-neutral-50 rounded"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddProject(true)}
                      className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      追加
                    </button>
                  )}
                </th>
                <th className="px-4 py-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {brandInfos.map((brand) => (
                <tr key={brand.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                    {brand.brand_name}
                  </td>
                  <td className="px-4 py-3">
                    {editingCell?.brandId === brand.id && editingCell?.field === 'brand_theme' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          handleUpdateCell(brand.id, 'brand_theme', editValue);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCell(brand.id, 'brand_theme', editValue);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-100"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setEditingCell({ brandId: brand.id, field: 'brand_theme' });
                          setEditValue(brand.brand_theme || '');
                        }}
                        className="text-sm text-neutral-700 cursor-pointer hover:bg-neutral-100 px-2 py-1 rounded min-h-[28px]"
                      >
                        {brand.brand_theme || <span className="text-neutral-400">クリックして入力</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingCell?.brandId === brand.id && editingCell?.field === 'special_feature' ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                          handleUpdateCell(brand.id, 'special_feature', editValue);
                          setEditingCell(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCell(brand.id, 'special_feature', editValue);
                            setEditingCell(null);
                          }
                          if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-100"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setEditingCell({ brandId: brand.id, field: 'special_feature' });
                          setEditValue(brand.special_feature || '');
                        }}
                        className="text-sm text-neutral-700 cursor-pointer hover:bg-neutral-100 px-2 py-1 rounded min-h-[28px]"
                      >
                        {brand.special_feature || <span className="text-neutral-400">クリックして入力</span>}
                      </div>
                    )}
                  </td>
                  {projectColumns.map(project => (
                    <td key={project} className="px-4 py-3">
                      {editingCell?.brandId === brand.id && editingCell?.field === project ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            handleUpdateCell(brand.id, project, editValue);
                            setEditingCell(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCell(brand.id, project, editValue);
                              setEditingCell(null);
                            }
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-100"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingCell({ brandId: brand.id, field: project });
                            setEditValue(brand.projects?.[project] || '');
                          }}
                          className="text-sm text-neutral-700 cursor-pointer hover:bg-neutral-100 px-2 py-1 rounded min-h-[28px]"
                        >
                          {brand.projects?.[project] || <span className="text-neutral-400">-</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {showAddBrand && (
                <tr className="bg-primary-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      placeholder="ブランド名"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddBrand();
                        if (e.key === 'Escape') {
                          setShowAddBrand(false);
                          setNewBrandName('');
                        }
                      }}
                      autoFocus
                    />
                  </td>
                  <td className="px-4 py-3" colSpan={projectColumns.length + 2}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddBrand}
                        className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                      >
                        追加
                      </button>
                      <button
                        onClick={() => {
                          setShowAddBrand(false);
                          setNewBrandName('');
                        }}
                        className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!showAddBrand && (
          <div className="px-4 py-3 border-t border-neutral-200">
            <button
              onClick={() => setShowAddBrand(true)}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              ブランドを追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}