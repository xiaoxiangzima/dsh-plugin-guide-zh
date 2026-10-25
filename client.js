/**
 * Browser half of the Plugin Guide bundle.
 *
 * One read-only Chinese guide page with two sections:
 *  - 插件: what each installed bundle does and where its effect shows up.
 *  - 技能: the same skills the composer's slash menu lists, explained in
 *    Chinese (the menu itself is core UI and shows each skill's own English
 *    SKILL.md description, which this page cannot rewrite).
 *
 * Every visible string is Chinese on purpose, so the page stays readable
 * without English and does not depend on the UI locale.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-guide-zh',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo } = React

    const API = '/api/plugin-guide/data'

    /* -------------------------------------------------------------- catalog */

    const GUIDE = {
      'dsh-plugin-guide-zh': {
        title: '中文说明（就是你正在看的这一页）',
        what: '把插件和技能翻成中文，讲清它们干什么、在哪里能看到。只读，不会改动任何东西。',
        where: '设置 → 插件 → 中文说明；插件面板里也有同名标签。',
      },
      '@deepseek-ai/dsh-base': {
        title: '核心引擎（官方基础包）',
        what: '整个 Harness 的能力底座：模型接入、会话与历史、工具系统、沙箱与审批、存储、技能全靠它。没有它界面无法工作。',
        where: '无处不在，属于宿主本体，不建议停用。',
      },
      '@deepseek-ai/dsh-web-app': {
        title: '网页界面（官方）',
        what: '你在浏览器里看到的这一整套界面：侧边栏、聊天区、设置面板、右侧栏、终端预览，都由它渲染。',
        where: '整个界面，属于宿主本体，不建议停用。',
      },
      '@deepseek-ai/dsh-experimental-auto-review': {
        title: '自动复核（官方实验）',
        what: '在 Auto 权限模式下，每次工具调用前先让模型自己审一遍，决定放行还是拦下，减少你手动点“允许”。',
        where: '没有单独界面；权限选择 Auto 时在后台起作用。',
      },
      '@dsh-market/plugin': {
        title: 'DSH Market 插件市场',
        what: '侧边栏里的插件市场：浏览、搜索、看“猜你喜欢”，一键安装别人的插件，也能管理已经装上的插件。',
        where: '最左侧图标列里的插件市场图标。',
      },
      '@goodandready/dsh-context-lens': {
        title: 'Context Lens 代码透镜',
        what: '给模型两个省字数的工具：一个把代码压成“结构骨架”，一个把又长又啰嗦的测试/构建日志压成只剩报错和结论。',
        where: '没有单独界面，模型需要时自动调用（context_lens_code / context_lens_log）。',
      },
      '@goodandready/dsh-plugin-notify': {
        title: 'Notify 完成提醒',
        what: '任务跑完、出错或者需要你确认时提醒你：提示音、右下角气泡、系统通知、IM webhook、手机 PWA 推送都能开。',
        where: '在插件页点它那一行，打开它自己的配置页。',
      },
      '@goodandready/dsh-time-machine': {
        title: 'Time Machine 时光机',
        what: '动手改代码之前先打一个检查点，改坏了可以一键回滚到某个快照，也能只还原其中某一个文件。',
        where: '右侧栏的时光机标签页；或让模型调用 time_machine_* 系列工具。',
      },
      'dsh-cost-meter': {
        title: '费用统计（Cost Meter）',
        what: '算钱：这一轮、这次会话、今天各花了多少，还有历史记录；内置 170 多个模型的价格，能查 Coding Plan 额度、账户余额，并提醒峰谷价切换。',
        where: '对话里的费用标签、设置里的「费用计量」页、侧边栏统计。',
      },
      'dsh-plugin-agent-workflow': {
        title: 'Agent Workflow 轨迹查看器',
        what: '把每一轮对话拆开给你看：你说了什么、真正发给模型的请求长什么样、模型回了什么、调了哪些工具、参数和结果是什么。',
        where: '对话框上方的视图切换里选「流程 / workflow」。',
      },
      'dsh-plugin-marketplace': {
        title: '插件市场（设置页版）',
        what: '在设置页里直接逛 GitHub 上打了 dsh-plugin 标签的项目：搜索、按 Star 排序、看安装方式。',
        where: '本机目前没看到它的入口（可能缺依赖没激活）；逛市场可以用左边图标列的 DSH Market。',
      },
      'dsh-plugin-mgr': {
        title: '插件管理器',
        what: '管理已装插件：列表、按补丁层启用/停用、检查更新、卸载。你看到的「已装管理」标签页就是它。',
        where: '设置 → 插件 → 已装管理。',
      },
      'dsh-plugin-ops-bundle': {
        title: '运维体检（Ops）',
        what: '给整套 Harness 做体检：扫描运行环境、列出每个插件的运行状态，发现问题还能开一个诊断对话让模型帮你查。',
        where: '设置里的运维/体检面板。',
      },
      'dsh-plugin-shop': {
        title: '插件商店（Shop）',
        what: '从一份可审计的插件目录里挑插件：浏览、安装、启用、更新都在一个页面里完成。',
        where: '设置 → 插件 → 商店标签页。',
      },
      'dsh-plugin-tool-management': {
        title: '工具与场景管理',
        what: '一个面板管六样东西：MCP 服务器、技能（skills）、场景、记忆、子智能体人格、AGENTS.md 预设。切换“场景”会整套换环境。',
        where: '设置 → 工具管理；也可以直接跟模型说“切到某个场景”。',
      },
      'dsh-whale-girl-pet': {
        title: '鲸鱼女仆桌宠',
        what: '住在界面里的蓝发鲸鱼女仆：开工/轮播/收工动画、任务完成气泡（用时、消耗、花费）、会话费用、分时段花费看板、睡眠与时间感知、余额/天气/喂食按钮。',
        where: '界面右下角；设置里有她的专属面板。',
      },
      'dsh-whale-widget': {
        title: '余额小鲸鱼挂件',
        what: '右下角常驻的小挂件：显示余额、今日已用、峰谷价；点它能弹出气泡，气泡序列、角色、动效、音效都能自定义。',
        where: '界面右下角。',
      },
      'uiskin-theme': {
        title: '海洋蓝玻璃主题',
        what: '把整套界面换成海洋幻想风：海洋背景、玻璃质感面板、海洋侧边栏、鲸鱼形状的设置按钮、彩色渐变模型名。',
        where: '整个界面的外观；主题偏好：设置 → 通用 → 外观。',
      },
    }

    /** The skills the composer's slash menu lists, explained in Chinese. */
    const SKILLS = {
      'agent-experience': {
        title: '工具与技能的表达规范',
        what: '规定“模型看得到的东西”怎么写：工具的名字、描述、参数说明，技能说明，以及多步工作流怎么组织，目的都是让模型找得到、用得对、少烧 context。',
        when: '要改工具定义、写/改技能、设计多步流程时。',
      },
      'cordis-composition-reference': {
        title: 'Cordis 组合与插件包清单',
        what: '解释 bundle patch 的 YAML 写法（insert、按 id 覆盖、group、disabled、isolate、!!js），并列出可安装的 Harness 插件包各自提供什么。',
        when: '要改 profile 组合、查某个插件包能干什么时。',
      },
      'cordis-plugin-development': {
        title: '开发/启用/调试插件',
        what: '从设计到安装验证的整套流程：写 bundle、加页面/面板/工具、启用默认关闭的插件、排查插件问题。',
        when: '想做插件、页面、面板、工具或 MCP 连接时——包括找不到目标界面时默认落到这里。',
      },
      'diagnose-windows-sandbox-acl': {
        title: 'Windows 沙箱权限诊断',
        what: 'Windows 上出现“沙箱拒绝读写”时，检查目标路径和每一级父目录的 ACL，并在同一次运行里修好它证明有问题的部分。',
        when: '工作区明明存在、却读写或列目录失败时。',
      },
      'editing-cordis-compositions': {
        title: '编写 Agent 预设与组合',
        what: '写、改、校验 agent preset 这类 Cordis 组合：哪部分该放主机侧、哪部分放预设，YAML 怎么写才符合当前版本，以及装上去能不能跑。',
        when: '要定制一个 Agent 预设时。',
      },
      'karpathy-guidelines': {
        title: '少犯错的编码守则',
        what: '写代码时的行为约束：不过度设计、小步改动、先讲清假设、先定可验证的成功标准。',
        when: '任何编码任务，尤其是重构和改别人代码时。',
      },
      office: {
        title: 'Office 文档总入口',
        what: '创建、编辑、检查、转换 Word / Excel / PPT / PDF 的总入口，会把你路由到下面更具体的技能。',
        when: '要处理任何文档时，先看它。',
      },
      'office-docx': {
        title: 'Word 文档（.docx）',
        what: '创建、读取、修改、校验 Word 文档。',
        when: '要做 .docx 时。',
      },
      'office-xlsx': {
        title: 'Excel 表格（.xlsx）',
        what: '读取、创建、修改 Excel 表格与公式，并校验结果。',
        when: '要做 .xlsx 时。',
      },
      'office-pptx': {
        title: 'PPT 演示（.pptx）',
        what: '创建、读取、修改、校验 PowerPoint 演示文稿。',
        when: '要做 .pptx 时。',
      },
      'office-export-pdf': {
        title: '导出 PDF',
        what: '把 Office 文档转成 PDF（用 LibreOffice Kit）。',
        when: '要交 PDF 时。',
      },
      'office-recalculate': {
        title: '重算表格公式',
        what: '刷新表格里的公式缓存，并核对算出来的值。',
        when: '改了公式或数据、需要确认结果时。',
      },
      'office-render': {
        title: '渲染成图片看排版',
        what: '把文档渲染成图片，用来检查分页、溢出、对齐这些视觉问题。',
        when: '要确认排版是否正常时。',
      },
      'reverse-engineer-anything': {
        title: '逆向分析（REA）',
        what: '分析二进制、安装包、Electron/JavaScript、固件、网页：反编译、比对版本、解释功能、给出重建线索。',
        when: '要弄清某个程序/包内部怎么实现时。',
      },
      ruflo: {
        title: '多智能体编排（ruflo）',
        what: '安装/初始化 ruflo、跑多智能体集群、用它的 MCP 工具（记忆、路由、钩子、子智能体、工作流）、查状态与插件。',
        when: '要用 ruflo 做多智能体协作时。',
      },
    }

    /* --------------------------------------------------------------- style */

    const S = {
      page: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '2px 2px 16px',
        maxHeight: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: 'var(--dsw-alias-label-primary)',
      },
      head: { display: 'flex', flexDirection: 'column', gap: '4px' },
      heading: { fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
      sub: { fontSize: '12.5px', lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
      bar: { display: 'flex', gap: '8px', alignItems: 'center' },
      search: {
        flex: '1 1 auto',
        minWidth: 0,
        padding: '7px 10px',
        fontSize: '13px',
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '8px',
        outline: 'none',
        boxSizing: 'border-box',
      },
      ghost: {
        flex: '0 0 auto',
        padding: '7px 12px',
        fontSize: '12.5px',
        color: 'var(--dsw-alias-label-primary)',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '8px',
        cursor: 'pointer',
      },
      section: { display: 'flex', flexDirection: 'column', gap: '8px' },
      sectionTitle: {
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: 'var(--dsw-alias-label-secondary)',
        margin: '6px 0 0',
      },
      card: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '12px 14px',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '12px',
      },
      rowTop: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' },
      name: { fontSize: '13.5px', fontWeight: 600, lineHeight: 1.4 },
      pkg: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: '11px',
        color: 'var(--dsw-alias-label-secondary)',
      },
      meta: { fontSize: '11.5px', color: 'var(--dsw-alias-label-secondary)' },
      pill: (on) => ({
        fontSize: '11px',
        lineHeight: '16px',
        padding: '0 7px',
        borderRadius: '999px',
        border: '1px solid ' + (on ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-border-l2)'),
        color: on ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-label-secondary)',
        whiteSpace: 'nowrap',
      }),
      tag: (alert) => ({
        fontSize: '11px',
        lineHeight: '16px',
        padding: '0 7px',
        borderRadius: '999px',
        border: '1px solid ' + (alert ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-border-l1)'),
        color: alert ? 'var(--dsw-alias-state-error-primary)' : 'var(--dsw-alias-label-secondary)',
        whiteSpace: 'nowrap',
      }),
      chip: (on) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        height: '26px',
        padding: '0 10px',
        fontSize: '12px',
        color: 'var(--dsw-alias-label-primary)',
        background: on ? 'var(--dsw-alias-bg-layer-2)' : 'transparent',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '999px',
        cursor: 'pointer',
      }),
      scrim: {
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.35)',
        zIndex: 60,
      },
      modal: {
        width: 'min(580px, 92vw)',
        maxHeight: '76vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '16px',
        background: 'var(--dsw-alias-bg-overlay)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: '14px',
        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.25)',
      },
      modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
      actions: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' },      what: { fontSize: '12.8px', lineHeight: 1.65 },
      where: { fontSize: '12px', lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)' },
      note: { fontSize: '12px', lineHeight: 1.6, color: 'var(--dsw-alias-label-secondary)', fontStyle: 'italic' },
      muted: { fontSize: '12.5px', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 },
      error: { fontSize: '12.5px', color: 'var(--dsw-alias-state-error-primary)', lineHeight: 1.6 },
      ok: { fontSize: '12.5px', color: 'var(--dsw-alias-state-success-primary)', lineHeight: 1.6 },
      footer: {
        fontSize: '11.5px',
        lineHeight: 1.6,
        color: 'var(--dsw-alias-label-secondary)',
        borderTop: '1px solid var(--dsw-alias-border-l1)',
        paddingTop: '8px',
      },
    }

    /* -------------------------------------------------------------- helpers */

    function pickText(value) {
      if (typeof value === 'string' && value.length > 0) return value
      if (value && typeof value === 'object') {
        for (const key of ['zh', 'zh-CN', 'zh-cn', 'en']) {
          const text = value[key]
          if (typeof text === 'string' && text.length > 0) return text
        }
        for (const text of Object.values(value)) {
          if (typeof text === 'string' && text.length > 0) return text
        }
      }
      return ''
    }

    function load() {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 45000)
      return fetch(API, { cache: 'no-store', signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error('HTTP ' + response.status)
          return response.json()
        })
        .finally(() => clearTimeout(timer))
    }

    /* --------------------------------------------------------- panel state */

    const panelListeners = new Set()
    let panelOpen = false
    /** The composer's actions plus a draft reader, captured by the composer button. */
    let insertBridge = { actions: null, getDraft: null }


    function setPanelOpen(next) {
      panelOpen = next
      for (const listener of [...panelListeners]) listener()
    }

    function usePanelOpen() {
      const [, bump] = useState(0)
      useEffect(() => {
        const listener = () => bump((n) => n + 1)
        panelListeners.add(listener)
        return () => {
          panelListeners.delete(listener)
        }
      }, [])
      return panelOpen
    }
    /* ------------------------------------------------------------ component */

    function GuidePage() {
      const [state, setState] = useState({ phase: 'loading', bundles: [], skills: [], error: '' })
      const [query, setQuery] = useState('')
      const [tick, setTick] = useState(0)

      useEffect(() => {
        const onFocus = () => setTick((n) => n + 1)
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
      }, [])

      useEffect(() => {
        let alive = true
        setState((prev) => ({ ...prev, phase: prev.bundles.length ? prev.phase : 'loading' }))
        load()
          .then((data) => {
            if (!alive) return
            setState({
              phase: 'ready',
              bundles: Array.isArray(data && data.bundles) ? data.bundles : [],
              skills: Array.isArray(data && data.skills) ? data.skills : [],
              error: data && data.ok === false ? String(data.error || '') : '',
            })
          })
          .catch((error) => {
            if (!alive) return
            setState({ phase: 'error', bundles: [], skills: [], error: error && error.message ? error.message : String(error) })
          })
        return () => {
          alive = false
        }
      }, [tick])

      const plugins = useMemo(() => {
        return state.bundles
          .filter((bundle) => bundle.enabled === true || bundle.installed === true)
          .map((bundle) => {
            const guide = GUIDE[bundle.name]
            const own = pickText(bundle.title)
            const description = pickText(bundle.description)
            return {
              key: 'plugin:' + bundle.name,
              name: String(bundle.name),
              official: bundle.official === true,
              missing: bundle.availability === 'missing',
              enabled: bundle.enabled === true,
              version: bundle.version || '',
              modules: Array.isArray(bundle.rows) ? bundle.rows.length : 0,
              title: guide ? guide.title : own || String(bundle.name),
              what: guide ? guide.what : typeof bundle.zh === 'string' && bundle.zh.length > 0 ? bundle.zh : description,
              where: guide ? guide.where : '',
              hasGuide: Boolean(guide),
              auto: !guide && typeof bundle.zh === 'string' && bundle.zh.length > 0,
            }
          })
      }, [state.bundles])

      const skills = useMemo(() => {
        const live = new Map(state.skills.map((skill) => [String(skill.name), skill]))
        const names = new Set([...live.keys(), ...Object.keys(SKILLS)])
        return [...names].sort().map((name) => {
          const guide = SKILLS[name]
          const skill = live.get(name)
          return {
            key: 'skill:' + name,
            name,
            title: guide ? guide.title : name,
            what: guide ? guide.what : skill && typeof skill.zh === 'string' && skill.zh.length > 0 ? skill.zh : String((skill && skill.description) || ''),
            when: guide ? guide.when : '',
            hasGuide: Boolean(guide),
            available: Boolean(skill),
            auto: !guide && Boolean(skill && typeof skill.zh === 'string' && skill.zh.length > 0),
          }
        })
      }, [state.skills])

      const needle = query.trim().toLowerCase()
      const match = (fields) =>
        !needle || fields.some((field) => String(field || '').toLowerCase().includes(needle))
      const shownPlugins = plugins.filter((item) => match([item.name, item.title, item.what, item.where]))
      const shownSkills = skills.filter((item) => match([item.name, item.title, item.what, item.when]))

      const pluginGroups = [
        { key: 'on', label: '插件 · 已启用', items: shownPlugins.filter((item) => item.enabled) },
        { key: 'off', label: '插件 · 已安装，但没启用', items: shownPlugins.filter((item) => !item.enabled) },
      ].filter((group) => group.items.length > 0)

      const renderPlugin = (item) =>
        h(
          'div',
          { key: item.key, style: S.card },
          h(
            'div',
            { style: S.rowTop },
            h('span', { style: S.name }, item.title),
            h('span', { style: S.pill(item.enabled) }, item.enabled ? '已启用' : '已停用'),
            item.missing ? h('span', { style: S.tag(true) }, '文件缺失') : null,
            item.official ? h('span', { style: S.tag(false) }, '官方') : null,
            item.auto ? h('span', { style: S.tag(false) }, '自动翻译') : null,
            h('code', { style: S.pkg }, item.name),
            item.version ? h('span', { style: S.meta }, 'v' + item.version) : null,
            item.modules > 1 ? h('span', { style: S.meta }, '含 ' + item.modules + ' 个组件') : null,
          ),
          item.what ? h('div', { style: S.what }, item.what) : null,
          !item.hasGuide ? h('div', { style: S.note }, '这个插件还没有中文说明，上面是它自带的描述。') : null,
          item.where ? h('div', { style: S.where }, '在哪看：' + item.where) : null,
        )

      const renderSkill = (item) =>
        h(
          'div',
          { key: item.key, style: S.card },
          h(
            'div',
            { style: S.rowTop },
            h('span', { style: S.name }, item.title),
            h('code', { style: S.pkg }, '/' + item.name),
            item.auto ? h('span', { style: S.tag(false) }, '自动翻译') : null,
          ),
          item.what ? h('div', { style: S.what }, item.what) : null,
          !item.hasGuide ? h('div', { style: S.note }, '这个技能还没有中文说明，上面是它自带的描述。') : null,
          item.when ? h('div', { style: S.where }, '什么时候用：' + item.when) : null,
        )

      return h(
        'div',
        { style: S.page },
        h(
          'div',
          { style: S.head },
          h('div', { style: S.heading }, '中文说明'),
          h('div', { style: S.sub }, '插件是做什么的、技能是做什么的、在哪里能看到。'),
        ),
        h(
          'div',
          { style: S.bar },
          h('input', {
            type: 'search',
            value: query,
            placeholder: '搜索插件、技能或关键词',
            'aria-label': '搜索',
            style: S.search,
            onChange: (event) => setQuery(event.target.value),
          }),
          h('button', { type: 'button', style: S.ghost, onClick: () => setTick((n) => n + 1) }, '刷新'),
        ),
        state.error ? h('div', { style: S.error }, '读取失败：' + state.error) : null,
        state.phase === 'loading' ? h('div', { style: S.muted }, '正在读取…') : null,
        state.phase === 'error'
          ? h(
              'div',
              { style: S.muted },
              h('button', { type: 'button', style: S.ghost, onClick: () => setTick((n) => n + 1) }, '重试'),
            )
          : null,

        shownSkills.length > 0
          ? h(
              'div',
              { style: S.section },
              h('div', { style: S.sectionTitle }, '技能 · ' + shownSkills.length),
              h(
                'div',
                { style: S.muted },
                '这就是输入框里打 / 时列出的那些技能。弹窗本身是核心界面，文案来自每个技能自己的 SKILL.md（英文、随版本发布）；下面是中文说明，标「自动翻译」的是模型生成并缓存过的。',
              ),
              shownSkills.map(renderSkill),
            )
          : null,

        pluginGroups.map((group) =>
          h(
            'div',
            { key: group.key, style: S.section },
            h('div', { style: S.sectionTitle }, group.label + ' · ' + group.items.length),
            group.items.map(renderPlugin),
          ),
        ),

        state.phase === 'ready' && shownSkills.length === 0 && pluginGroups.length === 0
          ? h('div', { style: S.muted }, '没有匹配的内容。')
          : null,

        h('div', { style: S.footer }, '这一页只做说明；启用/停用插件请用「已装管理」或「商店」。'),
      )
    }

    function SkillButton(props) {
      const open = usePanelOpen()
      const actions = props && props.inputActions ? props.inputActions : null
      const useInput = props && props.useInput ? props.useInput : null
      const draft = useInput ? useInput((state) => (state && typeof state.draft === 'string' ? state.draft : '')) : ''
      useEffect(() => {
        insertBridge = { actions, getDraft: () => draft }
      }, [actions, draft])
      return h(
        'button',
        {
          type: 'button',
          title: '技能中文说明',
          'aria-label': '技能中文说明',
          'aria-expanded': open ? 'true' : 'false',
          style: S.chip(open),
          onClick: () => setPanelOpen(!open),
        },
        '技能',
      )
    }

    function SkillPanel() {
      const open = usePanelOpen()
      const [state, setState] = useState({ phase: 'idle', skills: [], error: '' })
      const [tick, setTick] = useState(0)

      useEffect(() => {
        // Refetch on every opening and on an explicit refresh, so a plugin or
        // skill installed in the meantime shows up without a page reload. The
        // previous rows stay on screen while the new list is loading.
        if (!open) return undefined
        let alive = true
        setState((prev) => ({ ...prev, phase: prev.skills.length > 0 ? prev.phase : 'loading' }))
        load()
          .then((data) => {
            if (!alive) return
            setState({
              phase: 'ready',
              skills: Array.isArray(data && data.skills) ? data.skills : [],
              error: data && data.ok === false ? String(data.error || '') : '',
            })
          })
          .catch((error) => {
            if (!alive) return
            const message = error && error.message ? error.message : String(error)
            setState((prev) => ({
              phase: prev.skills.length > 0 ? prev.phase : 'error',
              skills: prev.skills,
              error: message,
            }))
          })
        return () => {
          alive = false
        }
      }, [open, tick])

      useEffect(() => {
        if (!open) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') setPanelOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [open])

      const [notice, setNotice] = useState('')

      async function useSkill(name) {
        const text = '/' + name + ' '
        const bridge = insertBridge || {}
        const actions = bridge.actions
        let inserted = false
        if (actions && typeof actions.setDraft === 'function') {
          const current = typeof bridge.getDraft === 'function' ? bridge.getDraft() || '' : ''
          const prefix = current.length === 0 || /\s$/.test(current) ? '' : ' '
          try {
            actions.setDraft(current + prefix + text)
            inserted = true
          } catch (error) {
            inserted = false
          }
        }
        if (inserted) {
          setPanelOpen(false)
          return
        }
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(text)
            setNotice('已复制「' + text.trim() + '」')
            return
          }
        } catch (error) {
          // fall through to the manual hint
        }
        setNotice('没法自动放入输入框，请手动输入 ' + text.trim())
      }

      if (!open) return null

      const rows = state.skills.map((skill) => {
        const guide = SKILLS[skill.name]
        const auto = !guide && typeof skill.zh === 'string' && skill.zh.length > 0
        return {
          name: String(skill.name),
          title: guide ? guide.title : String(skill.name),
          what: guide ? guide.what : auto ? skill.zh : String(skill.description || ''),
          when: guide ? guide.when : '',
          auto,
        }
      })

      return h(
        'div',
        { style: S.scrim, role: 'presentation', onClick: () => setPanelOpen(false) },
        h(
          'div',
          {
            style: S.modal,
            role: 'dialog',
            'aria-label': '技能中文说明',
            onClick: (event) => event.stopPropagation(),
          },
          h(
            'div',
            { style: S.modalHead },
            h('span', { style: S.name }, '技能中文说明'),
            h(
              'div',
              { style: S.actions },
              h('button', { type: 'button', style: S.ghost, onClick: () => setTick((n) => n + 1) }, '刷新'),
              h('button', { type: 'button', style: S.ghost, onClick: () => setPanelOpen(false) }, '关闭'),
            ),
          ),
          h('div', { style: S.muted }, '这些就是输入框里打 / 时列出的技能。弹窗本身是内置界面，文案来自各技能的 SKILL.md；这里是中文说明，标「自动翻译」的是模型生成并缓存过的。'),
          notice ? h('div', { style: S.ok }, notice) : null,
          state.phase === 'loading' ? h('div', { style: S.muted }, '正在读取…') : null,
          state.phase === 'error'
            ? h(
                'div',
                { style: S.error },
                '读取失败：' + state.error + ' ',
                h(
                  'button',
                  { type: 'button', style: S.ghost, onClick: () => setState({ phase: 'idle', skills: [], error: '' }) },
                  '重试',
                ),
              )
            : null,
          rows.map((item) =>
            h(
              'div',
              { key: item.name, style: S.card },
              h(
                'div',
                { style: S.rowTop },
                h('span', { style: S.name }, item.title),
                h('code', { style: S.pkg }, '/' + item.name),
                item.auto ? h('span', { style: S.tag(false) }, '自动翻译') : null,
              ),
              item.what ? h('div', { style: S.what }, item.what) : null,
              item.when ? h('div', { style: S.where }, '什么时候用：' + item.when) : null,
              h(
                'div',
                { style: S.actions },
                h(
                  'button',
                  { type: 'button', style: S.ghost, onClick: () => useSkill(item.name) },
                  '使用这个技能',
                ),
              ),
            ),
          ),
        ),
      )
    }
    /* ------------------------------------------------------------- register */

    return {
      inject: ['slots'],
      apply(ctx) {
        const view = () => h(GuidePage)
        const surfaces = [
          { name: 'settings.plugins.tab', id: 'plugin-guide-zh', order: 5 },
          { name: 'plugins.tab', id: 'plugin-guide-zh', order: 5 },
        ]
        for (const surface of surfaces) {
          ctx.slots.inject(surface.name, () =>
            ctx.slots.register(
              { name: surface.name, id: surface.id, order: surface.order, label: '中文说明' },
              view,
            ),
          )
        }
        // A Chinese skill reference right beside the composer, opened from the
        // tool row and rendered in the frame overlay so it cannot be clipped.
        ctx.slots.inject('conversation.input.left', () =>
          ctx.slots.register(
            { name: 'conversation.input.left', id: 'plugin-guide-zh-skill', order: 20, label: '技能' },
            (props) => h(SkillButton, props),
          ),
        )
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'plugin-guide-zh-skill-panel', order: 100 },
            () => h(SkillPanel),
          ),
        )
      },
    }
  },
})
