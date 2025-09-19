INSERT INTO contracts (
    client_id, contract_number, description, value, start_date, end_date,
    status, payment_frequency, notes, external_id
) VALUES 
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_1', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_1'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_2', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_2'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_3', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_3'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_6', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_6'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_7', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_7'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_8', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_8'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_9', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_9'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_10', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_10'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_11', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_11'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_12', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_12'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_13', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_13'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_14', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_14'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_15', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_15'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_16', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_16'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_17', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_17'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_18', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_18'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_19', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_19'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_20', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_20'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_21', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_21'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_22', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_22'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_23', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_23'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_24', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_24'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_26', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_26'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_27', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_27'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_28', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_28'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_30', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_30'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_31', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_31'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_32', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_32'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_33', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_33'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_35', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_35'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_36', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_36'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_37', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_37'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_38', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_38'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_39', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_39'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_40', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_40'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_41', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_41'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_42', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_42'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_43', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_43'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_44', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_44'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_45', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_45'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_46', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_46'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_47', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_47'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_48', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_48'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_49', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_49'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_50', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_50'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_51', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_51'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_52', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_52'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_53', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_53'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_54', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_54'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_55', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_55'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_56', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_56'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_61', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_61'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_62', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_62'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_63', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_63'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_64', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_64'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_65', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_65'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_66', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_66'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_69', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_69'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_70', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_70'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_71', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_71'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_72', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_72'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_74', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_74'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_75', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_75'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_76', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_76'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_77', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_77'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_78', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_78'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_79', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_79'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_81', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_81'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_82', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_82'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_83', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_83'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_84', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_84'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_85', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_85'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_86', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_86'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_87', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_87'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_88', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_88'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_90', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_90'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_91', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_91'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_92', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_92'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_94', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_94'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_95', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_95'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_96', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_96'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_97', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_97'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_101', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_101'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_102', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_102'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_103', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_103'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_104', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_104'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_105', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_105'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_106', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_106'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_108', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_108'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_110', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_110'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_111', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_111'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_112', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_112'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_113', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_113'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_114', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_114'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_116', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_116'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_117', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_117'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_118', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_118'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_119', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_119'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_120', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_120'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_121', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_121'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_125', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_125'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_126', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_126'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_127', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_127'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_129', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_129'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_130', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_130'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_131', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_131'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_132', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_132'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_134', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_134'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_135', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_135'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_136', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_136'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_137', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_137'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_138', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_138'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_139', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_139'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_140', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_140'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_141', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_141'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_145', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_145'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_146', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_146'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_147', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_147'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_148', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_148'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_151', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_151'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_152', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_152'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_155', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_155'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_156', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_156'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_157', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_157'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_161', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_161'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_162', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_162'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_163', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_163'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_164', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_164'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_165', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_165'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_166', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_166'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_167', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_167'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_168', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_168'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_170', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_170'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_171', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_171'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_172', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_172'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_173', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_173'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_175', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_175'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_176', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_176'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_177', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_177'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_178', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_178'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_180', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_180'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_181', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_181'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_182', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_182'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_183', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_183'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_184', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_184'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_186', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_186'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_189', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_189'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_191', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_191'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_192', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_192'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_193', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_193'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_194', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_194'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_195', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_195'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_197', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_197'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_198', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_198'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_199', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_199'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_200', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_200'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_201', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_201'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_202', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_202'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_203', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_203'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_204', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_204'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_206', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_206'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_208', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_208'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_209', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_209'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_210', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_210'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_211', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_211'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_215', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_215'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_217', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_217'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_219', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_219'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_220', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_220'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_221', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_221'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_222', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_222'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_223', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_223'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_225', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_225'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_226', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_226'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_227', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_227'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_228', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_228'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_229', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_229'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_230', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_230'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_231', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_231'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_232', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_232'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_233', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_233'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_234', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_234'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_235', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_235'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_237', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_237'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_238', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_238'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_239', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_239'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_240', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_240'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_241', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_241'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_242', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_242'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_243', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_243'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_244', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_244'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_245', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_245'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_248', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_248'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_249', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_249'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_250', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_250'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_251', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_251'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_252', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_252'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_253', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_253'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_255', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_255'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_256', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_256'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_260', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_260'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_261', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_261'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_262', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_262'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_265', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_265'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_266', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_266'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_267', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_267'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_268', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_268'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_270', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_270'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_271', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_271'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_272', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_272'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_273', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_273'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_274', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_274'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_275', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_275'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_276', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_276'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_277', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_277'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_278', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_278'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_281', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_281'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_282', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_282'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_285', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_285'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_286', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_286'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_287', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_287'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_289', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_289'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_290', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_290'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_295', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_295'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_296', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_296'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_297', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_297'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_298', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_298'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_299', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_299'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_300', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_300'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_302', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_302'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_303', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_303'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_304', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_304'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_305', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_305'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_306', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_306'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_309', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_309'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_310', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_310'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_311', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_311'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_312', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_312'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_313', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_313'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_315', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_315'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_317', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_317'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_320', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_320'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_321', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_321'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_322', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_322'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_323', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_323'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_324', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_324'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_325', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_325'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_326', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_326'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_327', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_327'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_329', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_329'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_330', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_330'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_331', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_331'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_333', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_333'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_334', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_334'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_336', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_336'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_337', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_337'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_338', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_338'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_341', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_341'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_342', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_342'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_343', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_343'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_344', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_344'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_345', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_345'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_347', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_347'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_348', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_348'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_349', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_349'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_350', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_350'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_352', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_352'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_353', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_353'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_354', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_354'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_355', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_355'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_356', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_356'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_357', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_357'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_361', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_361'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_362', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_362'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_364', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_364'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_366', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_366'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_368', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_368'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_369', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_369'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_370', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_370'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_371', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_371'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_373', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_373'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_374', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_374'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_375', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_375'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_376', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_376'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_377', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_377'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_378', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_378'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_379', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_379'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_381', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_381'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_382', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_382'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_383', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_383'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_384', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_384'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_385', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_385'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_386', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_386'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_387', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_387'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_392', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_392'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_393', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_393'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_394', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_394'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_395', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_395'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_396', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_396'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_397', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_397'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_399', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_399'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_402', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_402'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_403', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_403'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_404', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_404'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_406', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_406'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_407', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_407'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_408', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_408'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_409', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_409'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_410', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_410'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_411', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_411'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_412', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_412'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_413', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_413'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_414', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_414'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_415', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_415'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_416', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_416'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_417', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_417'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_418', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_418'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_419', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_419'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_421', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_421'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_422', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_422'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_423', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_423'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_424', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_424'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_426', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_426'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_427', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_427'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_428', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_428'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_430', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_430'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_432', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_432'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_433', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_433'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_435', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_435'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_436', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_436'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_437', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_437'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_438', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_438'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_440', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_440'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_443', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_443'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_451', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_451'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_452', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_452'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_454', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_454'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_462', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_462'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_467', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_467'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_486', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_486'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_493', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_493'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_507', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_507'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_543', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_543'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_550', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_550'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_561', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_561'
    ),
    (
        (SELECT id FROM clients WHERE external_id = NULL LIMIT 1),
        'CONT_566', 'Serviço não especificado', 0, NULL, NULL, 
        'active', 'monthly', NULL, 'ca_566'
    )
ON CONFLICT (external_id) DO UPDATE SET
    description = EXCLUDED.description,
    value = EXCLUDED.value,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    updated_at = NOW();